import React from 'react'
import {render, wait} from 'react-testing-library'
import {hijackEffects} from '../'

const originalUseEffect = React.useEffect
const originalUseLayoutEffect = React.useLayoutEffect

afterEach(() => {
  React.useEffect = originalUseEffect
  React.useLayoutEffect = originalUseLayoutEffect
})

function useForceUpdate() {
  const [, update] = React.useState()
  return () => update({})
}

test('does nothing without being called', () => {
  expect(React.useEffect).toEqual(originalUseEffect)
  expect(React.useLayoutEffect).toEqual(originalUseLayoutEffect)
})

test('hijacks useEffect and useLayoutEffect when calling hijackEffects', () => {
  const restore = hijackEffects()

  expect(React.useEffect).not.toEqual(originalUseEffect)
  expect(React.useLayoutEffect).not.toEqual(originalUseLayoutEffect)

  restore()

  expect(React.useEffect).toEqual(originalUseEffect)
  expect(React.useLayoutEffect).toEqual(originalUseLayoutEffect)
})

test('an effect which sets state but has no dependencies will warn', async () => {
  jest.spyOn(console, 'warn').mockImplementation(() => {})

  React.useEffect = function tryCatchUseEffect(cb, deps) {
    return originalUseEffect(() => {
      // stop the infinite loop if we've warned. The test is over now, but
      // before we restore the useEffect back to where it should go, we need
      // to prevent the infinite loop otherwise React will figure out what
      // we're doing and be mad :-(
      if (console.warn.mock.calls.length) {
        return
      }
      try {
        return cb()
      } catch (e) {
        if (e.message && e.message.includes('stop-runaway-react-effects')) {
          // try/catch prevents test from failing. We assert on the warning
        } else {
          // something else is up
          throw e
        }
      }
    }, deps)
  }

  hijackEffects({callCount: 2})

  function Test() {
    const forceUpdate = useForceUpdate()
    React.useEffect(() => {
      forceUpdate()
    })
    return null
  }

  let rendered = false

  // it's super weird, but somehow the error is not try/catchable here, but
  // it still fails the test. It's really odd. So we do some weird stuff to make
  // sure we wait for it to be thrown.
  await wait(
    () => {
      if (!rendered) {
        rendered = true
        render(<Test />)
      }
      expect(console.warn).toHaveBeenCalledTimes(1)
    },
    {timeout: 500},
  )
  expect(console.warn.mock.calls[0]).toMatchInlineSnapshot(`
            Array [
              "The following effect callback was invoked 2 times in 1000ms",
              "
            ",
              "() => {
                  forceUpdate();
                }",
              "
            ",
              "This effect is not called with a dependencies argument and probably should. Start by adding \`[]\` as a second argument to the useEffect call, then add any other dependencies as elements to that array. You may also be interested in installing ESLint with https://npm.im/eslint-plugin-react-hooks",
            ]
      `)
  console.warn.mockRestore()
})

test('an effect which sets state and has changing dependencies will warn', async () => {
  jest.spyOn(console, 'warn').mockImplementation(() => {})

  React.useEffect = function tryCatchUseEffect(cb, deps) {
    return originalUseEffect(() => {
      // stop the infinite loop if we've warned. The test is over now, but
      // before we restore the useEffect back to where it should go, we need
      // to prevent the infinite loop otherwise React will figure out what
      // we're doing and be mad :-(
      if (console.warn.mock.calls.length) {
        return
      }
      try {
        return cb()
      } catch (e) {
        if (e.message && e.message.includes('stop-runaway-react-effects')) {
          // try/catch prevents test from failing. We assert on the warning
        } else {
          // something else is up
          throw e
        }
      }
    }, deps)
  }

  hijackEffects({callCount: 2})

  function Test() {
    const forceUpdate = useForceUpdate()
    React.useEffect(() => {
      forceUpdate()
    }, ['I am unchanged', {}, 'I am also unchanged'])
    return null
  }

  let rendered = false

  // it's super weird, but somehow the error is not try/catchable here, but
  // it still fails the test. It's really odd. So we do some weird stuff to make
  // sure we wait for it to be thrown.
  await wait(
    () => {
      if (!rendered) {
        rendered = true
        render(<Test />)
      }
      expect(console.warn).toHaveBeenCalledTimes(1)
    },
    {timeout: 500},
  )
  expect(console.warn.mock.calls[0]).toMatchInlineSnapshot(`
    Array [
      "The following effect callback was invoked 2 times in 1000ms",
      "
    ",
      "() => {
          forceUpdate();
        }",
      "
    ",
      "Here are the dependencies this effect was called with the last 2 times:",
      Array [
        Array [
          "I am unchanged",
          Object {},
          "I am also unchanged",
        ],
        Array [
          "I am unchanged",
          Object {},
          "I am also unchanged",
        ],
      ],
      "
    ",
      "Here are the dependency changes between each call:",
      Array [
        Array [
          "I am unchanged",
          Object {},
          "I am also unchanged",
        ],
        Array [
          "UNCHANGED",
          Object {},
          "UNCHANGED",
        ],
      ],
      "
    ",
      "Try to find where those changing dependencies are initialized. You probably need to memoize them using React.useMemo or React.useCallback",
    ]
  `)
  console.warn.mockRestore()
})

/* eslint func-name-matching:0, consistent-return:0, react-hooks/exhaustive-deps:0 */
