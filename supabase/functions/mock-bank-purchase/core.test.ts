import assert from 'node:assert/strict'
import test from 'node:test'

import {
  handleMockBankRequest,
  type MockBankDependencies,
} from './core.ts'

function request(body: Record<string, unknown> = {
  productId: 'rewardchild_cash_200',
  idempotencyKey: 'mock-request-1',
}) {
  return new Request('http://localhost/functions/v1/mock-bank-purchase', {
    method: 'POST',
    headers: { authorization: 'Bearer valid-token' },
    body: JSON.stringify(body),
  })
}

function dependencies(overrides: Partial<MockBankDependencies> = {}): MockBankDependencies {
  return {
    enabled: true,
    authenticate: async () => ({ authUserId: 'parent-auth-id', role: 'PARENT' }),
    purchase: async () => ({ id: 1, status: 'PAID', cashGranted: 200 }),
    ...overrides,
  }
}

async function responseBody(response: Response) {
  return await response.json() as Record<string, unknown>
}

test('disabled server returns 404 before processing a purchase', async () => {
  let called = false
  const response = await handleMockBankRequest(request(), dependencies({
    enabled: false,
    purchase: async () => {
      called = true
      return { id: 1, status: 'PAID', cashGranted: 200 }
    },
  }))

  assert.equal(response.status, 404)
  assert.equal(called, false)
})

test('parent receives only the server purchase result', async () => {
  const response = await handleMockBankRequest(request(), dependencies())
  assert.equal(response.status, 200)
  assert.deepEqual(await responseBody(response), {
    purchaseId: 1,
    status: 'PAID',
    consumeStatus: 'CONSUMED',
    cashGranted: 200,
  })
})

test('child cannot create a Mock Bank purchase', async () => {
  let called = false
  const response = await handleMockBankRequest(request(), dependencies({
    authenticate: async () => ({ authUserId: 'child-auth-id', role: 'CHILD' }),
    purchase: async () => {
      called = true
      return { id: 1, status: 'PAID', cashGranted: 200 }
    },
  }))

  assert.equal(response.status, 403)
  assert.equal(called, false)
})

test('cash, price, and parent injection are rejected', async () => {
  for (const key of ['cashAmount', 'price', 'parentId']) {
    const response = await handleMockBankRequest(request({
      productId: 'rewardchild_cash_200',
      idempotencyKey: 'mock-request-1',
      [key]: 999999,
    }), dependencies())
    assert.equal(response.status, 400)
  }
})

test('purchase failure returns no success payload', async () => {
  const response = await handleMockBankRequest(request(), dependencies({
    purchase: async () => { throw new Error('DATABASE_FAILURE') },
  }))

  assert.equal(response.status, 409)
  assert.deepEqual(await responseBody(response), { code: 'MOCK_BANK_PURCHASE_FAILED' })
})
