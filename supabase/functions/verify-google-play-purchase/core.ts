export type UserProfile = {
  authUserId: string
  role: string
}

export type BankItem = {
  googlePlayProductId: string
}

export type BankPurchase = {
  id: number
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED'
  cashGranted: number
  consumeStatus: 'NOT_STARTED' | 'PENDING' | 'FAILED' | 'CONSUMED'
}

export type GoogleProductPurchaseV2 = {
  purchaseStateContext?: {
    purchaseState?: string
  }
  productLineItem?: Array<{
    productId?: string
    productOfferDetails?: {
      quantity?: number
      consumptionState?: string
    }
  }>
  orderId?: string
  obfuscatedExternalAccountId?: string
}

export type PurchaseDependencies = {
  authenticate: (accessToken: string) => Promise<UserProfile>
  getActiveBankItem: (productId: string) => Promise<BankItem | null>
  verifyGooglePurchase: (purchaseToken: string) => Promise<GoogleProductPurchaseV2>
  createPending: (
    authUserId: string,
    productId: string,
    purchaseToken: string,
  ) => Promise<BankPurchase>
  finalize: (
    purchaseToken: string,
    productId: string,
    orderId?: string,
  ) => Promise<BankPurchase>
  recordConsumeResult: (
    purchaseToken: string,
    succeeded: boolean,
    errorCode?: string,
  ) => Promise<BankPurchase>
  consumeGooglePurchase: (productId: string, purchaseToken: string) => Promise<void>
}

export class GooglePlayError extends Error {
  readonly kind: 'INVALID' | 'TEMPORARY' | 'CONFIGURATION'
  readonly safeCode: string

  constructor(
    kind: 'INVALID' | 'TEMPORARY' | 'CONFIGURATION',
    safeCode: string,
  ) {
    super(safeCode)
    this.name = 'GooglePlayError'
    this.kind = kind
    this.safeCode = safeCode
  }
}

const responseHeaders = {
  'access-control-allow-headers': 'authorization, apikey, content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
  'content-type': 'application/json; charset=utf-8',
}

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders })
}

function purchaseResponse(purchase: BankPurchase, consumeStatus = purchase.consumeStatus) {
  return {
    purchaseId: purchase.id,
    status: purchase.status,
    consumeStatus,
    cashGranted: purchase.cashGranted,
  }
}

function readBearerToken(request: Request) {
  const authorization = request.headers.get('authorization') ?? ''
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}

async function readInput(request: Request) {
  const body = await request.json() as Record<string, unknown>
  const productId = typeof body.productId === 'string' ? body.productId.trim() : ''
  const purchaseToken = typeof body.purchaseToken === 'string' ? body.purchaseToken.trim() : ''

  if (!productId || productId.length > 200 || !purchaseToken || purchaseToken.length > 4096) {
    throw new Error('INVALID_INPUT')
  }

  return { productId, purchaseToken }
}

export async function obfuscatedAccountIdFor(authUserId: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(authUserId),
  )
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('')
}

function getVerifiedLineItem(purchase: GoogleProductPurchaseV2, requestedProductId: string) {
  const lineItems = purchase.productLineItem ?? []
  if (lineItems.length !== 1 || lineItems[0]?.productId !== requestedProductId) {
    return null
  }

  const quantity = lineItems[0].productOfferDetails?.quantity ?? 1
  if (quantity !== 1) return null
  return lineItems[0]
}

function isConsumed(purchase: GoogleProductPurchaseV2, requestedProductId: string) {
  return getVerifiedLineItem(purchase, requestedProductId)
    ?.productOfferDetails?.consumptionState === 'CONSUMPTION_STATE_CONSUMED'
}

async function recordConsumeFailure(
  dependencies: PurchaseDependencies,
  purchaseToken: string,
  errorCode: string,
) {
  try {
    return await dependencies.recordConsumeResult(purchaseToken, false, errorCode)
  } catch {
    return null
  }
}

export async function handlePurchaseRequest(
  request: Request,
  dependencies: PurchaseDependencies,
): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: responseHeaders })
  if (request.method !== 'POST') return jsonResponse(405, { code: 'METHOD_NOT_ALLOWED' })

  const accessToken = readBearerToken(request)
  if (!accessToken) return jsonResponse(401, { code: 'AUTHENTICATION_REQUIRED' })

  let profile: UserProfile
  try {
    profile = await dependencies.authenticate(accessToken)
  } catch {
    return jsonResponse(401, { code: 'AUTHENTICATION_FAILED' })
  }

  if (profile.role !== 'PARENT') {
    return jsonResponse(403, { code: 'PARENT_REQUIRED' })
  }

  let input: { productId: string; purchaseToken: string }
  try {
    input = await readInput(request)
  } catch {
    return jsonResponse(400, { code: 'INVALID_REQUEST' })
  }

  try {
    const item = await dependencies.getActiveBankItem(input.productId)
    if (!item || item.googlePlayProductId !== input.productId) {
      return jsonResponse(404, { code: 'BANK_ITEM_NOT_ACTIVE' })
    }
  } catch {
    return jsonResponse(500, { code: 'BANK_CATALOG_UNAVAILABLE', retryable: true })
  }

  let googlePurchase: GoogleProductPurchaseV2
  try {
    googlePurchase = await dependencies.verifyGooglePurchase(input.purchaseToken)
  } catch (error) {
    if (error instanceof GooglePlayError && error.kind === 'INVALID') {
      return jsonResponse(400, { code: 'INVALID_GOOGLE_PURCHASE' })
    }
    return jsonResponse(503, { code: 'GOOGLE_PLAY_UNAVAILABLE', retryable: true })
  }

  const lineItem = getVerifiedLineItem(googlePurchase, input.productId)
  if (!lineItem) {
    return jsonResponse(409, { code: 'GOOGLE_PLAY_PRODUCT_MISMATCH' })
  }

  if (googlePurchase.obfuscatedExternalAccountId) {
    const expectedAccountId = await obfuscatedAccountIdFor(profile.authUserId)
    if (googlePurchase.obfuscatedExternalAccountId !== expectedAccountId) {
      return jsonResponse(403, { code: 'GOOGLE_PLAY_ACCOUNT_MISMATCH' })
    }
  }

  const purchaseState = googlePurchase.purchaseStateContext?.purchaseState
  if (purchaseState === 'CANCELLED') {
    return jsonResponse(409, { code: 'GOOGLE_PURCHASE_CANCELLED' })
  }
  if (purchaseState !== 'PENDING' && purchaseState !== 'PURCHASED') {
    return jsonResponse(400, { code: 'INVALID_GOOGLE_PURCHASE_STATE' })
  }

  let pendingPurchase: BankPurchase
  try {
    pendingPurchase = await dependencies.createPending(
      profile.authUserId,
      input.productId,
      input.purchaseToken,
    )
  } catch {
    return jsonResponse(409, { code: 'BANK_PURCHASE_CONFLICT' })
  }

  if (purchaseState === 'PENDING') {
    return jsonResponse(202, {
      ...purchaseResponse(pendingPurchase),
      status: 'PENDING',
      retryable: true,
    })
  }

  let paidPurchase: BankPurchase
  try {
    paidPurchase = await dependencies.finalize(
      input.purchaseToken,
      input.productId,
      googlePurchase.orderId,
    )
  } catch {
    return jsonResponse(500, { code: 'BANK_FINALIZE_FAILED', retryable: true })
  }

  if (isConsumed(googlePurchase, input.productId)) {
    try {
      const consumed = await dependencies.recordConsumeResult(input.purchaseToken, true)
      return jsonResponse(200, purchaseResponse(consumed, 'CONSUMED'))
    } catch {
      return jsonResponse(202, {
        ...purchaseResponse(paidPurchase, 'PENDING'),
        code: 'CONSUME_TRACKING_PENDING',
        retryable: true,
      })
    }
  }

  try {
    await dependencies.consumeGooglePurchase(input.productId, input.purchaseToken)
    const consumed = await dependencies.recordConsumeResult(input.purchaseToken, true)
    return jsonResponse(200, purchaseResponse(consumed, 'CONSUMED'))
  } catch (consumeError) {
    try {
      const refreshed = await dependencies.verifyGooglePurchase(input.purchaseToken)
      if (isConsumed(refreshed, input.productId)) {
        const consumed = await dependencies.recordConsumeResult(input.purchaseToken, true)
        return jsonResponse(200, purchaseResponse(consumed, 'CONSUMED'))
      }
    } catch {
      // A later request can safely retry because finalization is idempotent.
    }

    const errorCode = consumeError instanceof GooglePlayError
      ? consumeError.safeCode
      : 'GOOGLE_CONSUME_FAILED'
    const failed = await recordConsumeFailure(
      dependencies,
      input.purchaseToken,
      errorCode,
    )

    return jsonResponse(202, {
      ...purchaseResponse(failed ?? paidPurchase, 'FAILED'),
      code: 'GOOGLE_CONSUME_PENDING',
      retryable: true,
    })
  }
}
