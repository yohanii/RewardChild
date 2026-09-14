import assert from 'node:assert/strict'
import test from 'node:test'

import { GooglePlayError } from '../verify-google-play-purchase/core.ts'
import {
  handleConsumeRetryRequest,
  type ConsumeRetryClaim,
  type ConsumeRetryDependencies,
} from './core.ts'

const claims: ConsumeRetryClaim[] = [
  {
    purchaseId: 1,
    productId: 'rewardchild_cash_200',
    purchaseToken: 'secret-token-one',
    leaseId: 'lease-one',
    attemptCount: 1,
  },
]

function request(apiKey = 'service-role-key') {
  return new Request('http://localhost/functions/v1/retry-google-play-consumption', {
    method: 'POST',
    headers: { apikey: apiKey },
  })
}

function dependencies(overrides: Partial<ConsumeRetryDependencies> = {}): ConsumeRetryDependencies {
  return {
    authorize: (incoming) => incoming.headers.get('apikey') === 'service-role-key',
    claim: async () => claims,
    consume: async () => {},
    verify: async () => ({}),
    complete: async () => {},
    ...overrides,
  }
}

async function body(response: Response) {
  return await response.json() as Record<string, unknown>
}

test('rejects ordinary authenticated callers before claiming', async () => {
  let claimed = false
  const response = await handleConsumeRetryRequest(request('publishable-key'), dependencies({
    claim: async () => {
      claimed = true
      return []
    },
  }))

  assert.equal(response.status, 401)
  assert.equal(claimed, false)
})

test('successful consume completes the lease as CONSUMED', async () => {
  const completions: unknown[][] = []
  const response = await handleConsumeRetryRequest(request(), dependencies({
    complete: async (...args) => { completions.push(args) },
  }))

  assert.equal(response.status, 200)
  assert.deepEqual(await body(response), {
    claimed: 1,
    consumed: 1,
    failed: 0,
    completionFailed: 0,
  })
  assert.deepEqual(completions, [['secret-token-one', 'lease-one', true]])
})

test('consume failure records a safe error and remains retryable', async () => {
  const completions: unknown[][] = []
  const response = await handleConsumeRetryRequest(request(), dependencies({
    consume: async () => {
      throw new GooglePlayError('TEMPORARY', 'GOOGLE_CONSUME_HTTP_503')
    },
    complete: async (...args) => { completions.push(args) },
  }))

  assert.equal(response.status, 200)
  assert.equal((await body(response)).failed, 1)
  assert.deepEqual(completions, [[
    'secret-token-one',
    'lease-one',
    false,
    'GOOGLE_CONSUME_HTTP_503',
  ]])
})

test('already-consumed Google purchase is recorded as success', async () => {
  const completions: unknown[][] = []
  const response = await handleConsumeRetryRequest(request(), dependencies({
    consume: async () => { throw new Error('already consumed') },
    verify: async () => ({
      productLineItem: [{
        productId: 'rewardchild_cash_200',
        productOfferDetails: { consumptionState: 'CONSUMPTION_STATE_CONSUMED' },
      }],
    }),
    complete: async (...args) => { completions.push(args) },
  }))

  assert.equal((await body(response)).consumed, 1)
  assert.deepEqual(completions, [['secret-token-one', 'lease-one', true]])
})

test('one purchase error does not stop the remaining batch', async () => {
  const batch = [
    claims[0],
    { ...claims[0], purchaseId: 2, purchaseToken: 'secret-token-two', leaseId: 'lease-two' },
  ]
  const completed: string[] = []
  const response = await handleConsumeRetryRequest(request(), dependencies({
    claim: async () => batch,
    consume: async (_productId, token) => {
      if (token === 'secret-token-one') throw new Error('first failed')
    },
    complete: async (token) => { completed.push(token) },
  }))

  assert.deepEqual(await body(response), {
    claimed: 2,
    consumed: 1,
    failed: 1,
    completionFailed: 0,
  })
  assert.deepEqual(completed, ['secret-token-one', 'secret-token-two'])
})

test('response never exposes purchase tokens', async () => {
  const response = await handleConsumeRetryRequest(request(), dependencies())
  assert.equal((await response.text()).includes('secret-token-one'), false)
})
