import { createClient } from '@supabase/supabase-js'
import {
  handleConsumeRetryRequest,
  type ConsumeRetryClaim,
  type ConsumeRetryDependencies,
} from './core.ts'
import {
  createGooglePlayClient,
  parseServiceAccountCredentials,
} from '../verify-google-play-purchase/googlePlay.ts'

function requiredEnvironment(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing required environment: ${name}`)
  return value
}

const supabaseUrl = requiredEnvironment('SUPABASE_URL')
const serviceRoleKey = requiredEnvironment('SUPABASE_SERVICE_ROLE_KEY')
const packageName = requiredEnvironment('GOOGLE_PLAY_PACKAGE_NAME')
const credentials = parseServiceAccountCredentials(
  requiredEnvironment('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON'),
)

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const googlePlay = createGooglePlayClient({ packageName, credentials })

const dependencies: ConsumeRetryDependencies = {
  authorize(request) {
    return request.headers.get('apikey') === serviceRoleKey
  },

  async claim(limit) {
    const { data, error } = await supabaseAdmin.rpc('claim_google_play_consume_retries', {
      p_limit: limit,
    })
    if (error) throw error
    return (data ?? []).map((row): ConsumeRetryClaim => ({
      purchaseId: row.purchase_id,
      productId: row.product_id,
      purchaseToken: row.purchase_token,
      leaseId: row.lease_id,
      attemptCount: row.attempt_count,
    }))
  },

  consume: (productId, purchaseToken) =>
    googlePlay.consumePurchase(productId, purchaseToken),

  verify: (purchaseToken) => googlePlay.verifyPurchase(purchaseToken),

  async complete(purchaseToken, leaseId, succeeded, errorCode) {
    const { error } = await supabaseAdmin.rpc('complete_google_play_consume_retry', {
      p_purchase_token: purchaseToken,
      p_lease_id: leaseId,
      p_succeeded: succeeded,
      p_error_code: errorCode,
    })
    if (error) throw error
  },
}

Deno.serve((request) => handleConsumeRetryRequest(request, dependencies))
