import { createClient } from '@supabase/supabase-js'
import {
  handlePurchaseRequest,
  type BankPurchase,
  type PurchaseDependencies,
} from './core.ts'
import {
  createGooglePlayClient,
  parseServiceAccountCredentials,
} from './googlePlay.ts'

function requiredEnvironment(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing required environment: ${name}`)
  return value
}

function toBankPurchase(row: Record<string, unknown>): BankPurchase {
  return {
    id: row.id as number,
    status: row.status as BankPurchase['status'],
    cashGranted: row.cash_granted as number,
    consumeStatus: row.consume_status as BankPurchase['consumeStatus'],
  }
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

const dependencies: PurchaseDependencies = {
  async authenticate(accessToken) {
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(accessToken)
    if (authError || !authData.user) throw new Error('AUTHENTICATION_FAILED')

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('auth_user_id', authData.user.id)
      .maybeSingle()

    if (profileError || !profile) throw new Error('PROFILE_NOT_FOUND')
    return { authUserId: authData.user.id, role: profile.role }
  },

  async getActiveBankItem(productId) {
    const { data, error } = await supabaseAdmin
      .from('bank_items')
      .select('google_play_product_id')
      .eq('google_play_product_id', productId)
      .eq('is_active', true)
      .maybeSingle()

    if (error) throw error
    return data?.google_play_product_id
      ? { googlePlayProductId: data.google_play_product_id }
      : null
  },

  verifyGooglePurchase: (purchaseToken) => googlePlay.verifyPurchase(purchaseToken),

  async createPending(authUserId, productId, purchaseToken) {
    const { data, error } = await supabaseAdmin.rpc('create_google_play_purchase_pending', {
      p_parent_auth_user_id: authUserId,
      p_google_play_product_id: productId,
      p_purchase_token: purchaseToken,
    })
    if (error || !data) throw error ?? new Error('PENDING_CREATE_FAILED')
    return toBankPurchase(data as Record<string, unknown>)
  },

  async finalize(purchaseToken, productId, orderId) {
    const { data, error } = await supabaseAdmin.rpc('finalize_google_play_purchase', {
      p_purchase_token: purchaseToken,
      p_verified_google_play_product_id: productId,
      p_google_order_id: orderId,
    })
    if (error || !data) throw error ?? new Error('FINALIZE_FAILED')
    return toBankPurchase(data as Record<string, unknown>)
  },

  async recordConsumeResult(purchaseToken, succeeded, errorCode) {
    const { data, error } = await supabaseAdmin.rpc('record_google_play_consume_result', {
      p_purchase_token: purchaseToken,
      p_succeeded: succeeded,
      p_error_code: errorCode,
    })
    if (error || !data) throw error ?? new Error('CONSUME_RESULT_FAILED')
    return toBankPurchase(data as Record<string, unknown>)
  },

  consumeGooglePurchase: (productId, purchaseToken) =>
    googlePlay.consumePurchase(productId, purchaseToken),
}

Deno.serve((request) => handlePurchaseRequest(request, dependencies))
