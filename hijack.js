if (process.env.NODE_ENV === 'development') {
  require('./dist/stop-runaway-react-effects.cjs').hijackEffects()
}
