if (process.env.NODE_ENV !== 'production') {
  require('./dist/stop-runaway-react-effects.cjs').hijackEffects()
}
