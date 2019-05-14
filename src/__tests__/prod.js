import React from 'react'

const originalUseEffect = React.useEffect
const originalUseLayoutEffect = React.useLayoutEffect

const env = process.env.NODE_ENV
process.env.NODE_ENV = 'production'

const {hijackEffects} = require('..')

process.env.NODE_ENV = env

test('does nothing in production', () => {
  const restore = hijackEffects()
  expect(React.useEffect).toEqual(originalUseEffect)
  expect(React.useLayoutEffect).toEqual(originalUseLayoutEffect)
  restore()
})
