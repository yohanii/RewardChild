import { createClient } from '@supabase/supabase-js'
import {
  handleMockBankRequest,
  type MockBankDependencies,
  type MockBankPurchase,
} from './core.ts'

function requiredEnvironment(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing required environment: ${name}`)
  return value
}

function toMockBankPurchase(row: Record<string, unknown>): MockBankPurchase {
  return {
    id: row.id as number,
    status: row.status as 'PAID',
    cashGranted: row.cash_granted as number,
  }
}

const supabaseUrl = requiredEnvironment('SUPABASE_URL')
const serviceRoleKey = requiredEnvironment('SUPABASE_SERVICE_ROLE_KEY')
const enabled = Deno.env.get('REWARDCHILD_ENV') === 'development'
  && Deno.env.get('ENABLE_MOCK_BANK_PURCHASES') === 'true'

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const dependencies: MockBankDependencies = {
  enabled,

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

  async purchase(authUserId, productId, idempotencyKey) {
    const { data, error } = await supabaseAdmin.rpc('create_mock_bank_purchase', {
      p_parent_auth_user_id: authUserId,
      p_product_id: productId,
      p_idempotency_key: idempotencyKey,
    })
    if (error || !data) throw error ?? new Error('MOCK_BANK_PURCHASE_FAILED')
    return toMockBankPurchase(data as Record<string, unknown>)
  },
}

Deno.serve((request) => handleMockBankRequest(request, dependencies))
