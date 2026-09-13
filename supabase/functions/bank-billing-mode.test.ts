import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveBankBillingMode } from '../../src/services/bankBillingMode.ts'

test('development can select the Mock billing provider', () => {
  assert.equal(resolveBankBillingMode('mock', true), 'mock')
})

test('production always selects Google Play even when Mock is requested', () => {
  assert.equal(resolveBankBillingMode('mock', false), 'google-play')
})

test('Google Play remains the default provider', () => {
  assert.equal(resolveBankBillingMode(undefined, true), 'google-play')
  assert.equal(resolveBankBillingMode('google-play', true), 'google-play')
})
