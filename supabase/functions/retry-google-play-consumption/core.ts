import {
  GooglePlayError,
  isGooglePurchaseConsumed,
  type GoogleProductPurchaseV2,
} from '../verify-google-play-purchase/core.ts'

export type ConsumeRetryClaim = {
  purchaseId: number
  productId: string
  purchaseToken: string
  leaseId: string
  attemptCount: number
}

export type ConsumeRetryDependencies = {
  authorize: (request: Request) => boolean
  claim: (limit: number) => Promise<ConsumeRetryClaim[]>
  consume: (productId: string, purchaseToken: string) => Promise<void>
  verify: (purchaseToken: string) => Promise<GoogleProductPurchaseV2>
  complete: (
    purchaseToken: string,
    leaseId: string,
    succeeded: boolean,
    errorCode?: string,
  ) => Promise<void>
}

const responseHeaders = { 'content-type': 'application/json; charset=utf-8' }

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders })
}

function safeConsumeError(error: unknown) {
  return error instanceof GooglePlayError
    ? error.safeCode
    : 'GOOGLE_CONSUME_FAILED'
}

async function consumeClaim(
  claim: ConsumeRetryClaim,
  dependencies: ConsumeRetryDependencies,
) {
  try {
    await dependencies.consume(claim.productId, claim.purchaseToken)
    await dependencies.complete(claim.purchaseToken, claim.leaseId, true)
    return 'consumed' as const
  } catch (consumeError) {
    try {
      const purchase = await dependencies.verify(claim.purchaseToken)
      if (isGooglePurchaseConsumed(purchase, claim.productId)) {
        await dependencies.complete(claim.purchaseToken, claim.leaseId, true)
        return 'consumed' as const
      }
    } catch {
      // Preserve only the original safe consume error. Tokens are never logged.
    }

    try {
      await dependencies.complete(
        claim.purchaseToken,
        claim.leaseId,
        false,
        safeConsumeError(consumeError),
      )
    } catch {
      return 'completion-failed' as const
    }
    return 'failed' as const
  }
}

export async function handleConsumeRetryRequest(
  request: Request,
  dependencies: ConsumeRetryDependencies,
): Promise<Response> {
  if (request.method !== 'POST') return jsonResponse(405, { code: 'METHOD_NOT_ALLOWED' })
  if (!dependencies.authorize(request)) return jsonResponse(401, { code: 'WORKER_UNAUTHORIZED' })

  let claims: ConsumeRetryClaim[]
  try {
    claims = await dependencies.claim(20)
  } catch {
    return jsonResponse(500, { code: 'CONSUME_RETRY_CLAIM_FAILED' })
  }

  const summary = { claimed: claims.length, consumed: 0, failed: 0, completionFailed: 0 }
  for (const claim of claims) {
    const result = await consumeClaim(claim, dependencies)
    if (result === 'consumed') summary.consumed += 1
    else if (result === 'failed') summary.failed += 1
    else summary.completionFailed += 1
  }

  return jsonResponse(200, summary)
}
