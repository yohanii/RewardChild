export type MockBankPurchase = {
  id: number
  status: 'PAID'
  cashGranted: number
}

export type MockBankDependencies = {
  enabled: boolean
  authenticate: (accessToken: string) => Promise<{
    authUserId: string
    role: string
  }>
  purchase: (
    authUserId: string,
    productId: string,
    idempotencyKey: string,
  ) => Promise<MockBankPurchase>
}

const responseHeaders = {
  'access-control-allow-headers': 'authorization, apikey, content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
  'content-type': 'application/json; charset=utf-8',
}

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders })
}

function readBearerToken(request: Request) {
  const authorization = request.headers.get('authorization') ?? ''
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}

async function readInput(request: Request) {
  const body = await request.json() as Record<string, unknown>
  const allowedKeys = new Set(['productId', 'idempotencyKey'])
  if (Object.keys(body).some((key) => !allowedKeys.has(key))) {
    throw new Error('UNEXPECTED_INPUT')
  }

  const productId = typeof body.productId === 'string' ? body.productId.trim() : ''
  const idempotencyKey = typeof body.idempotencyKey === 'string'
    ? body.idempotencyKey.trim()
    : ''

  if (
    !productId || productId.length > 200
    || !idempotencyKey || idempotencyKey.length > 200
  ) {
    throw new Error('INVALID_INPUT')
  }

  return { productId, idempotencyKey }
}

export async function handleMockBankRequest(
  request: Request,
  dependencies: MockBankDependencies,
): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: responseHeaders })
  }
  if (!dependencies.enabled) {
    return jsonResponse(404, { code: 'MOCK_BANK_DISABLED' })
  }
  if (request.method !== 'POST') {
    return jsonResponse(405, { code: 'METHOD_NOT_ALLOWED' })
  }

  const accessToken = readBearerToken(request)
  if (!accessToken) return jsonResponse(401, { code: 'AUTHENTICATION_REQUIRED' })

  let profile: { authUserId: string; role: string }
  try {
    profile = await dependencies.authenticate(accessToken)
  } catch {
    return jsonResponse(401, { code: 'AUTHENTICATION_FAILED' })
  }

  if (profile.role !== 'PARENT') {
    return jsonResponse(403, { code: 'PARENT_REQUIRED' })
  }

  let input: { productId: string; idempotencyKey: string }
  try {
    input = await readInput(request)
  } catch {
    return jsonResponse(400, { code: 'INVALID_REQUEST' })
  }

  try {
    const purchase = await dependencies.purchase(
      profile.authUserId,
      input.productId,
      input.idempotencyKey,
    )
    return jsonResponse(200, {
      purchaseId: purchase.id,
      status: purchase.status,
      consumeStatus: 'CONSUMED',
      cashGranted: purchase.cashGranted,
    })
  } catch {
    return jsonResponse(409, { code: 'MOCK_BANK_PURCHASE_FAILED' })
  }
}
