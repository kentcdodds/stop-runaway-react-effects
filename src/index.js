import React from 'react'

// I'm not sure these are the right numbers and changes to these numbers will
// not be considered breaking. We're just trying to approximate what a usual
// combination would be to determine whether the effect is runaway.
const DEFAULT_CALL_COUNT = 60
const DEFAULT_TIME_LIMIT = 1000

// this file is basically gone in production...
// but people can still call the functions safely either way.
const noop = () => function restore() {}
const last = array => array[array.length - 1]

const hijackEffectHook =
  process.env.NODE_ENV === 'production'
    ? noop
    : function hijackEffectHook(
        hookName,
        {callCount = DEFAULT_CALL_COUNT, timeLimit = DEFAULT_TIME_LIMIT} = {},
      ) {
        const originalHook = React[hookName]

        React[hookName] = getHijackedEffectHook({
          hookName,
          callCount,
          timeLimit,
        })

        return function restore() {
          React[hookName] = originalHook
        }
      }

function getHijackedEffectHook({hookName, callCount, timeLimit}) {
  const originalHook = React[hookName]
  return function useHijackedEffect(...args) {
    const [hookCallback, deps] = args
    const ref = React.useRef([])
    const warnedRef = React.useRef(false)

    return originalHook.call(
      React,
      () => {
        const calls = ref.current
        const oldestCall = last(calls)
        const now = Date.now()
        calls.push({time: now, args})
        if (
          !warnedRef.current &&
          calls.length >= callCount &&
          oldestCall.time > now - timeLimit
        ) {
          const allRecentCallDependencies = calls.map(c => c.args[1])
          const messages = [
            `The following effect callback was invoked ${callCount} times in ${timeLimit}ms`,
            '\n',
            hookCallback.toString(),
          ]
          if (allRecentCallDependencies.some(Boolean)) {
            messages.push(
              '\n',
              `Here are the dependencies this effect was called with the last ${callCount} times:`,
              allRecentCallDependencies,
            )
            messages.push(
              '\n',
              `Here are the dependency changes between each call:`,
              allRecentCallDependencies.map((callDeps, callIndex) => {
                if (callIndex === 0) {
                  return callDeps
                }
                return callDeps.map((dep, depIndex) => {
                  const prevDep =
                    allRecentCallDependencies[callIndex - 1][depIndex]
                  return Object.is(dep, prevDep) ? 'UNCHANGED' : dep
                })
              }),
            )
            messages.push(
              '\n',
              `Try to find where those changing dependencies are initialized. You probably need to memoize them using React.useMemo or React.useCallback`,
            )
          } else {
            messages.push(
              '\n',
              `This effect is not called with a dependencies argument and probably should. Start by adding \`[]\` as a second argument to the ${hookName} call, then add any other dependencies as elements to that array. You may also be interested in installing ESLint with https://npm.im/eslint-plugin-react-hooks`,
            )
          }
          console.warn(...messages)
          warnedRef.current = true

          throw new Error(
            `Uh oh... Looks like we've got a runaway ${hookName}. Check the console for more info. Make sure the ${hookName} is being passed the right dependencies. (By the way, this error message is from https://npm.im/stop-runaway-react-effects, not React)`,
          )
        }

        // remove old records
        ref.current = calls
          // only store up to the callCount
          .slice(0, callCount)
          // only store effects called within the timeLimit
          .filter(r => r.time > now - timeLimit)

        // call the original callback
        return hookCallback()
      },
      deps,
    )
  }
}

const hijackEffects =
  process.env.NODE_ENV === 'production'
    ? noop
    : function hijackEffects(options) {
        const restoreUseEffect = hijackEffectHook('useEffect', options)
        const restoreUseLayoutEffect = hijackEffectHook(
          'useLayoutEffect',
          options,
        )
        return function restore() {
          restoreUseEffect()
          restoreUseLayoutEffect()
        }
      }

export {hijackEffects, hijackEffectHook}
