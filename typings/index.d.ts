interface Options {
  callCount?: number
  timeLimit?: number
}

type Restore = () => void

export function hijackEffects(options?: Options): Restore

export function hijackEffectHook(hookName: string, options?: Options): Restore
