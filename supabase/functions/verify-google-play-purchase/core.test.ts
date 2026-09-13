import assert from 'node:assert/strict'
import test from 'node:test'

import {
  GooglePlayError,
  handlePurchaseRequest,
  obfuscatedAccountIdFor,
  type BankPurchase,
  type GoogleProductPurchaseV2,
  type PurchaseDependencies,
} from './core.ts'

const authUserId = '10000000-0000-0000-0000-000000000001'
const productId = 'rewardchild_cash_200'
const purchaseToken = 'test-purchase-token'

function googlePurchase({
  state = 'PURCHASED',
  product = productId,
  accountId,
  consumed = false,
}: {
  state?: string
  product?: string
  accountId?: string
  consumed?: boolean
} = {}): GoogleProductPurchaseV2 {
  return {
    purchaseStateContext: { purchaseState: state },
    productLineItem: [{
      productId: product,
      productOfferDetails: {
        quantity: 1,
        consumptionState: consumed
          ? 'CONSUMPTION_STATE_CONSUMED'
          : 'CONSUMPTION_STATE_YET_TO_BE_CONSUMED',
      },
    }],
    orderId: 'GPA.0000-0000-0000-00000',
    obfuscatedExternalAccountId: accountId,
  }
}

function request(body = { productId, purchaseToken }) {
  return new Request('http://localhost/functions/v1/verify-google-play-purchase', {
    method: 'POST',
    headers: {
      authorization: 'Bearer valid-user-jwt',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

async function responseBody(response: Response) {
  return await response.json() as Record<string, unknown>
}

function createHarness(options: {
  role?: string
  activeItem?: boolean
  verifiedPurchase?: GoogleProductPurchaseV2
  verifyError?: GooglePlayError
  finalizeFails?: boolean
  consumeFailures?: number
} = {}) {
  const state = {
    cashGrantedCount: 0,
    consumeCalls: 0,
    consumeRecordCalls: 0,
    createPendingCalls: 0,
    finalizeCalls: 0,
    googleConsumed: false,
    purchase: null as BankPurchase | null,
    remainingConsumeFailures: options.consumeFailures ?? 0,
  }

  const currentPurchase = (): BankPurchase => {
    if (!state.purchase) {
      state.purchase = {
        id: 91,
        status: 'PENDING',
        cashGranted: 200,
        consumeStatus: 'NOT_STARTED',
      }
    }
    return state.purchase
  }

  const dependencies: PurchaseDependencies = {
    async authenticate() {
      return { authUserId, role: options.role ?? 'PARENT' }
    },
    async getActiveBankItem(requestedProductId) {
      return options.activeItem === false
        ? null
        : { googlePlayProductId: requestedProductId }
    },
    async verifyGooglePurchase() {
      if (options.verifyError) throw options.verifyError
      const verified = structuredClone(options.verifiedPurchase ?? googlePurchase())
      const details = verified.productLineItem?.[0]?.productOfferDetails
      if (details && state.googleConsumed) {
        details.consumptionState = 'CONSUMPTION_STATE_CONSUMED'
      }
      return verified
    },
    async createPending() {
      state.createPendingCalls += 1
      return currentPurchase()
    },
    async finalize() {
      state.finalizeCalls += 1
      if (options.finalizeFails) throw new Error('simulated finalize failure')
      const purchase = currentPurchase()
      if (purchase.status === 'PENDING') {
        purchase.status = 'PAID'
        purchase.consumeStatus = 'PENDING'
        state.cashGrantedCount += 1
      }
      return purchase
    },
    async recordConsumeResult(_token, succeeded) {
      state.consumeRecordCalls += 1
      const purchase = currentPurchase()
      if (purchase.consumeStatus !== 'CONSUMED') {
        purchase.consumeStatus = succeeded ? 'CONSUMED' : 'FAILED'
      }
      return purchase
    },
    async consumeGooglePurchase() {
      state.consumeCalls += 1
      if (state.remainingConsumeFailures > 0) {
        state.remainingConsumeFailures -= 1
        throw new GooglePlayError('TEMPORARY', 'GOOGLE_CONSUME_HTTP_503')
      }
      state.googleConsumed = true
    },
  }

  return { dependencies, state }
}

test('valid parent purchase grants CASH once and consumes the product', async () => {
  const { dependencies, state } = createHarness()
  const response = await handlePurchaseRequest(request(), dependencies)

  assert.equal(response.status, 200)
  assert.equal((await responseBody(response)).consumeStatus, 'CONSUMED')
  assert.equal(state.cashGrantedCount, 1)
  assert.equal(state.consumeCalls, 1)
})

test('replaying the same token does not grant CASH twice', async () => {
  const { dependencies, state } = createHarness()

  assert.equal((await handlePurchaseRequest(request(), dependencies)).status, 200)
  assert.equal((await handlePurchaseRequest(request(), dependencies)).status, 200)
  assert.equal(state.cashGrantedCount, 1)
  assert.equal(state.consumeCalls, 1)
})

test('CHILD cannot purchase Bank CASH', async () => {
  const { dependencies, state } = createHarness({ role: 'CHILD' })
  const response = await handlePurchaseRequest(request(), dependencies)

  assert.equal(response.status, 403)
  assert.equal((await responseBody(response)).code, 'PARENT_REQUIRED')
  assert.equal(state.createPendingCalls, 0)
})

test('PENDING Google purchase creates no CASH transaction', async () => {
  const { dependencies, state } = createHarness({
    verifiedPurchase: googlePurchase({ state: 'PENDING' }),
  })
  const response = await handlePurchaseRequest(request(), dependencies)

  assert.equal(response.status, 202)
  assert.equal(state.createPendingCalls, 1)
  assert.equal(state.finalizeCalls, 0)
  assert.equal(state.cashGrantedCount, 0)
})

test('invalid and cancelled Google purchases grant no CASH', async (t) => {
  await t.test('invalid token', async () => {
    const { dependencies, state } = createHarness({
      verifyError: new GooglePlayError('INVALID', 'GOOGLE_PURCHASE_NOT_FOUND'),
    })
    const response = await handlePurchaseRequest(request(), dependencies)
    assert.equal(response.status, 400)
    assert.equal(state.createPendingCalls, 0)
  })

  await t.test('cancelled purchase', async () => {
    const { dependencies, state } = createHarness({
      verifiedPurchase: googlePurchase({ state: 'CANCELLED' }),
    })
    const response = await handlePurchaseRequest(request(), dependencies)
    assert.equal(response.status, 409)
    assert.equal(state.createPendingCalls, 0)
  })
})

test('Google product mismatch grants no CASH', async () => {
  const { dependencies, state } = createHarness({
    verifiedPurchase: googlePurchase({ product: 'unrelated_product' }),
  })
  const response = await handlePurchaseRequest(request(), dependencies)

  assert.equal(response.status, 409)
  assert.equal((await responseBody(response)).code, 'GOOGLE_PLAY_PRODUCT_MISMATCH')
  assert.equal(state.createPendingCalls, 0)
})

test('Google account mapping mismatch grants no CASH', async () => {
  const { dependencies, state } = createHarness({
    verifiedPurchase: googlePurchase({ accountId: 'different-account-hash' }),
  })
  const response = await handlePurchaseRequest(request(), dependencies)

  assert.equal(response.status, 403)
  assert.equal((await responseBody(response)).code, 'GOOGLE_PLAY_ACCOUNT_MISMATCH')
  assert.equal(state.createPendingCalls, 0)
})

test('matching obfuscated account mapping is accepted', async () => {
  const accountId = await obfuscatedAccountIdFor(authUserId)
  const { dependencies, state } = createHarness({
    verifiedPurchase: googlePurchase({ accountId }),
  })
  const response = await handlePurchaseRequest(request(), dependencies)

  assert.equal(response.status, 200)
  assert.equal(state.cashGrantedCount, 1)
})

test('temporary Google API error grants no CASH', async () => {
  const { dependencies, state } = createHarness({
    verifyError: new GooglePlayError('TEMPORARY', 'GOOGLE_VERIFY_HTTP_503'),
  })
  const response = await handlePurchaseRequest(request(), dependencies)

  assert.equal(response.status, 503)
  assert.equal(state.createPendingCalls, 0)
  assert.equal(state.cashGrantedCount, 0)
})

test('finalize failure leaves grant and consume untouched', async () => {
  const { dependencies, state } = createHarness({ finalizeFails: true })
  const response = await handlePurchaseRequest(request(), dependencies)

  assert.equal(response.status, 500)
  assert.equal((await responseBody(response)).code, 'BANK_FINALIZE_FAILED')
  assert.equal(state.cashGrantedCount, 0)
  assert.equal(state.consumeCalls, 0)
})

test('consume failure retries consumption without granting CASH again', async () => {
  const { dependencies, state } = createHarness({ consumeFailures: 1 })

  const firstResponse = await handlePurchaseRequest(request(), dependencies)
  assert.equal(firstResponse.status, 202)
  assert.equal((await responseBody(firstResponse)).consumeStatus, 'FAILED')
  assert.equal(state.cashGrantedCount, 1)

  const retryResponse = await handlePurchaseRequest(request(), dependencies)
  assert.equal(retryResponse.status, 200)
  assert.equal((await responseBody(retryResponse)).consumeStatus, 'CONSUMED')
  assert.equal(state.cashGrantedCount, 1)
  assert.equal(state.consumeCalls, 2)
})
