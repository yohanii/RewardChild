import {
  createGooglePlayObfuscatedAccountId,
  isBankProductId,
  verifyGooglePlayPurchase,
  type GooglePlayVerificationResult,
} from '@/src/services/googlePlayBilling'
import { supabase } from '@/src/services/supabaseClient'
import {
  resolveBankBillingMode,
  type BankBillingMode,
} from '@/src/services/bankBillingMode'
import * as Crypto from 'expo-crypto'
import {
  ErrorCode,
  isUserCancelledError,
  useIAP,
  type ExpoPurchaseError,
  type Purchase,
} from 'expo-iap'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { AppState, Platform } from 'react-native'

export type BankBillingProduct = {
  id: string
  displayPrice: string
}

export type BankBillingErrorKind = 'cancelled' | 'pending' | 'network' | 'failed'

type UseBankBillingProviderOptions = {
  authUserId?: string
  productIds: string[]
  onSuccess: (result: GooglePlayVerificationResult) => Promise<void>
  onError: (kind: BankBillingErrorKind) => void
}

export type BankBillingProvider = {
  mode: BankBillingMode
  connected: boolean
  products: Map<string, BankBillingProduct>
  purchase: (productId: string) => Promise<void>
  recover: () => Promise<void>
  reconnect: () => Promise<boolean>
}

export const BANK_BILLING_MODE: BankBillingMode = resolveBankBillingMode(
  process.env.EXPO_PUBLIC_BANK_BILLING_PROVIDER,
  __DEV__,
)

function googlePlayErrorKind(error: ExpoPurchaseError): BankBillingErrorKind {
  if (isUserCancelledError(error) || error.code === ErrorCode.UserCancelled) return 'cancelled'
  if (error.code === ErrorCode.Pending) return 'pending'
  if (
    error.code === ErrorCode.NetworkError
    || error.code === ErrorCode.ServiceDisconnected
    || error.code === ErrorCode.ServiceTimeout
  ) return 'network'
  return 'failed'
}

async function invokeMockPurchase(productId: string, idempotencyKey: string) {
  return await supabase.functions.invoke<GooglePlayVerificationResult>('mock-bank-purchase', {
    body: {
      productId,
      idempotencyKey,
    },
  })
}

export function useBankBillingProvider({
  authUserId,
  productIds,
  onSuccess,
  onError,
}: UseBankBillingProviderOptions) {
  const processingTokensRef = useRef(new Set<string>())
  const activeProductIdsRef = useRef(new Set(productIds))
  const pendingMockKeysRef = useRef(new Map<string, string>())

  useEffect(() => {
    activeProductIdsRef.current = new Set(productIds)
  }, [productIds])

  const processGooglePurchase = useCallback(async (purchase: Purchase) => {
    if (!isBankProductId(purchase.productId)) return
    if (purchase.purchaseState === 'pending') {
      onError('pending')
      return
    }
    if (purchase.purchaseState !== 'purchased' || !purchase.purchaseToken) {
      onError('failed')
      return
    }
    if (!activeProductIdsRef.current.has(purchase.productId)) return
    if (processingTokensRef.current.has(purchase.purchaseToken)) return

    processingTokensRef.current.add(purchase.purchaseToken)
    try {
      const { data, error } = await verifyGooglePlayPurchase(
        purchase.productId,
        purchase.purchaseToken,
      )
      if (error || !data) throw error ?? new Error('EMPTY_VERIFICATION_RESPONSE')
      if (data.status === 'PENDING') {
        onError('pending')
        return
      }
      if (data.status !== 'PAID') throw new Error('PURCHASE_NOT_PAID')
      await onSuccess(data)
    } catch (error) {
      const isNetworkError = error instanceof Error
        && (error.name === 'FunctionsFetchError' || error.name === 'FunctionsRelayError')
      onError(isNetworkError ? 'network' : 'failed')
    } finally {
      processingTokensRef.current.delete(purchase.purchaseToken)
    }
  }, [onError, onSuccess])

  const {
    connected: googleConnected,
    products: googleProducts,
    availablePurchases,
    fetchProducts,
    getAvailablePurchases,
    requestPurchase,
    reconnect,
  } = useIAP({
    onPurchaseSuccess: (purchase) => {
      if (BANK_BILLING_MODE === 'google-play') void processGooglePurchase(purchase)
    },
    onPurchaseError: (error) => {
      if (BANK_BILLING_MODE === 'google-play') onError(googlePlayErrorKind(error))
    },
    onError: () => {
      if (BANK_BILLING_MODE === 'google-play') onError('failed')
    },
  })

  useEffect(() => {
    if (
      BANK_BILLING_MODE !== 'google-play'
      || Platform.OS !== 'android'
      || !googleConnected
      || productIds.length === 0
    ) return

    void fetchProducts({ skus: productIds, type: 'in-app' }).catch(() => onError('failed'))
  }, [fetchProducts, googleConnected, onError, productIds])

  useEffect(() => {
    if (BANK_BILLING_MODE !== 'google-play') return
    for (const purchase of availablePurchases) void processGooglePurchase(purchase)
  }, [availablePurchases, processGooglePurchase])

  const recover = useCallback(async () => {
    if (
      BANK_BILLING_MODE !== 'google-play'
      || Platform.OS !== 'android'
      || !googleConnected
    ) return
    await getAvailablePurchases()
  }, [getAvailablePurchases, googleConnected])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void recover().catch(() => onError('network'))
    })
    return () => subscription.remove()
  }, [onError, recover])

  const purchase = useCallback(async (productId: string) => {
    if (!activeProductIdsRef.current.has(productId)) throw new Error('BANK_ITEM_NOT_ACTIVE')

    if (BANK_BILLING_MODE === 'mock') {
      const idempotencyKey = pendingMockKeysRef.current.get(productId) ?? Crypto.randomUUID()
      pendingMockKeysRef.current.set(productId, idempotencyKey)
      const { data, error } = await invokeMockPurchase(productId, idempotencyKey)
      if (error || !data || data.status !== 'PAID') {
        throw error ?? new Error('MOCK_PURCHASE_FAILED')
      }
      pendingMockKeysRef.current.delete(productId)
      await onSuccess(data)
      return
    }

    if (Platform.OS !== 'android' || !authUserId) throw new Error('ANDROID_REQUIRED')
    const obfuscatedAccountId = await createGooglePlayObfuscatedAccountId(authUserId)
    await requestPurchase({
      request: { google: { skus: [productId], obfuscatedAccountId } },
      type: 'in-app',
    })
  }, [authUserId, onSuccess, requestPurchase])

  const products = useMemo(() => {
    if (BANK_BILLING_MODE === 'mock') {
      return new Map(productIds.map((id) => [id, { id, displayPrice: 'Mock' }]))
    }
    return new Map<string, BankBillingProduct>(
      googleProducts.map((product) => [product.id, {
        id: product.id,
        displayPrice: product.displayPrice,
      }]),
    )
  }, [googleProducts, productIds])

  const reconnectProvider = useCallback(async () => {
    if (BANK_BILLING_MODE === 'mock') return true
    return await reconnect()
  }, [reconnect])

  return {
    mode: BANK_BILLING_MODE,
    connected: BANK_BILLING_MODE === 'mock' || googleConnected,
    products,
    purchase,
    recover,
    reconnect: reconnectProvider,
  } satisfies BankBillingProvider
}
