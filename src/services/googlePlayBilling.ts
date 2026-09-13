import { supabase } from '@/src/services/supabaseClient'
import * as Crypto from 'expo-crypto'

export const BANK_PRODUCT_IDS = [
  'rewardchild_cash_200',
  'rewardchild_cash_660',
  'rewardchild_cash_1200',
] as const

export type BankProductId = (typeof BANK_PRODUCT_IDS)[number]

export type GooglePlayVerificationResult = {
  purchaseId: number
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED'
  consumeStatus: 'NOT_STARTED' | 'PENDING' | 'FAILED' | 'CONSUMED'
  cashGranted: number
  code?: string
  retryable?: boolean
}

export function isBankProductId(value: string): value is BankProductId {
  return BANK_PRODUCT_IDS.some((productId) => productId === value)
}

export async function createGooglePlayObfuscatedAccountId(authUserId: string) {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    authUserId,
    { encoding: Crypto.CryptoEncoding.HEX },
  )

  return digest.toLowerCase()
}

export async function verifyGooglePlayPurchase(productId: string, purchaseToken: string) {
  return await supabase.functions.invoke<GooglePlayVerificationResult>(
    'verify-google-play-purchase',
    {
      body: { productId, purchaseToken },
    },
  )
}
