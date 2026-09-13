import {
  BANK_PRODUCT_IDS,
  createGooglePlayObfuscatedAccountId,
  isBankProductId,
  verifyGooglePlayPurchase,
} from '@/src/services/googlePlayBilling'
import { supabase } from '@/src/services/supabaseClient'
import type { Enums, Tables } from '@/src/types/database.types'
import {
  ErrorCode,
  isUserCancelledError,
  useIAP,
  type ExpoPurchaseError,
  type Purchase,
} from 'expo-iap'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppState, Platform } from 'react-native'

export type BankItem = Pick<
  Tables<'bank_items'>,
  'id' | 'title' | 'cash_amount' | 'google_play_product_id' | 'sort_order'
>

export type BankPurchase = Pick<
  Tables<'bank_purchases'>,
  'id' | 'cash_granted' | 'status' | 'created_at'
>

type BankProfile = {
  id: number
  authUserId: string
  role: Enums<'user_role'>
}

type BankBalance = {
  attendance: number
  cash: number
}

export type BankFeedback = {
  tone: 'info' | 'success' | 'error'
  message: string
}

function billingErrorFeedback(error: ExpoPurchaseError): BankFeedback {
  if (isUserCancelledError(error) || error.code === ErrorCode.UserCancelled) {
    return { tone: 'info', message: '결제가 취소되었어요.' }
  }
  if (error.code === ErrorCode.Pending) {
    return {
      tone: 'info',
      message: '결제가 처리 중입니다. 완료되면 CASH에 반영돼요.',
    }
  }
  if (
    error.code === ErrorCode.NetworkError ||
    error.code === ErrorCode.ServiceDisconnected ||
    error.code === ErrorCode.ServiceTimeout
  ) {
    return {
      tone: 'error',
      message: '네트워크 연결을 확인한 뒤 다시 시도해 주세요.',
    }
  }
  return {
    tone: 'error',
    message: 'Google Play 결제를 시작하지 못했어요. 잠시 후 다시 시도해 주세요.',
  }
}

export function useBankScreen() {
  const [profile, setProfile] = useState<BankProfile | null>(null)
  const [balance, setBalance] = useState<BankBalance>({ attendance: 0, cash: 0 })
  const [items, setItems] = useState<BankItem[]>([])
  const [purchases, setPurchases] = useState<BankPurchase[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [processingProductId, setProcessingProductId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<BankFeedback | null>(null)
  const processingTokensRef = useRef(new Set<string>())
  const activeProductIdsRef = useRef(new Set<string>())

  const loadBankData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      router.replace('/login')
      return
    }

    const { data: profileRow, error: profileError } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (profileError || !profileRow) throw profileError ?? new Error('PROFILE_NOT_FOUND')
    if (profileRow.role !== 'PARENT') {
      router.replace('/home')
      return
    }

    const nextProfile: BankProfile = {
      id: profileRow.id,
      authUserId: user.id,
      role: profileRow.role,
    }
    setProfile(nextProfile)

    const [balanceResult, itemResult, purchaseResult] = await Promise.all([
      supabase
        .from('balances')
        .select('type, amount')
        .eq('user_id', nextProfile.id)
        .in('type', ['ATTENDANCE', 'CASH']),
      supabase
        .from('bank_items')
        .select('id, title, cash_amount, google_play_product_id, sort_order')
        .eq('is_active', true)
        .in('google_play_product_id', [...BANK_PRODUCT_IDS])
        .order('sort_order', { ascending: true }),
      supabase
        .from('bank_purchases')
        .select('id, cash_granted, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    if (balanceResult.error) throw balanceResult.error
    if (itemResult.error) throw itemResult.error
    if (purchaseResult.error) throw purchaseResult.error

    const balanceRows = balanceResult.data ?? []
    setBalance({
      attendance: balanceRows.find((row) => row.type === 'ATTENDANCE')?.amount ?? 0,
      cash: balanceRows.find((row) => row.type === 'CASH')?.amount ?? 0,
    })

    const nextItems = itemResult.data ?? []
    activeProductIdsRef.current = new Set(
      nextItems.flatMap((item) => item.google_play_product_id ?? []),
    )
    setItems(nextItems)
    setPurchases(purchaseResult.data ?? [])
  }, [])

  const refreshBankData = useCallback(async () => {
    setRefreshing(true)
    try {
      await loadBankData()
    } catch {
      setFeedback({
        tone: 'error',
        message: 'Bank 정보를 새로 불러오지 못했어요.',
      })
    } finally {
      setRefreshing(false)
    }
  }, [loadBankData])

  const processPurchase = useCallback(async (purchase: Purchase) => {
    if (!isBankProductId(purchase.productId)) return

    if (purchase.purchaseState === 'pending') {
      setProcessingProductId(null)
      setFeedback({
        tone: 'info',
        message: '결제가 처리 중입니다. 결제 완료 후 자동으로 반영됩니다.',
      })
      return
    }

    if (purchase.purchaseState !== 'purchased' || !purchase.purchaseToken) {
      setProcessingProductId(null)
      setFeedback({
        tone: 'error',
        message: 'Google Play 구매 정보를 확인하지 못했어요.',
      })
      return
    }

    if (!activeProductIdsRef.current.has(purchase.productId)) return
    if (processingTokensRef.current.has(purchase.purchaseToken)) return

    processingTokensRef.current.add(purchase.purchaseToken)
    setProcessingProductId(purchase.productId)
    setFeedback({ tone: 'info', message: '결제를 안전하게 확인하고 있어요.' })

    try {
      const { data, error } = await verifyGooglePlayPurchase(
        purchase.productId,
        purchase.purchaseToken,
      )
      if (error || !data) throw error ?? new Error('EMPTY_VERIFICATION_RESPONSE')

      if (data.status === 'PENDING') {
        setFeedback({
          tone: 'info',
          message: '결제가 처리 중입니다. 결제 완료 후 자동으로 반영됩니다.',
        })
        return
      }

      if (data.status !== 'PAID') throw new Error('PURCHASE_NOT_PAID')

      await loadBankData()
      setFeedback({
        tone: 'success',
        message: data.consumeStatus === 'CONSUMED'
          ? `${data.cashGranted.toLocaleString()} CASH가 충전되었어요.`
          : `${data.cashGranted.toLocaleString()} CASH가 반영되었어요. 결제 마무리는 자동으로 재시도됩니다.`,
      })
    } catch (error) {
      const isNetworkError = error instanceof Error &&
        (error.name === 'FunctionsFetchError' || error.name === 'FunctionsRelayError')
      setFeedback({
        tone: 'error',
        message: isNetworkError
          ? '네트워크 연결 후 결제 내역을 다시 확인해 주세요.'
          : '서버에서 결제를 확인하지 못했어요. 결제 내역 확인을 다시 시도해 주세요.',
      })
    } finally {
      processingTokensRef.current.delete(purchase.purchaseToken)
      setProcessingProductId(null)
    }
  }, [loadBankData])

  const handlePurchaseError = useCallback((error: ExpoPurchaseError) => {
    setProcessingProductId(null)
    setFeedback(billingErrorFeedback(error))
  }, [])

  const {
    connected,
    products,
    availablePurchases,
    fetchProducts,
    getAvailablePurchases,
    requestPurchase,
    reconnect,
  } = useIAP({
    onPurchaseSuccess: (purchase) => {
      void processPurchase(purchase)
    },
    onPurchaseError: handlePurchaseError,
    onError: () => {
      setFeedback({
        tone: 'error',
        message: 'Google Play 결제 정보를 불러오지 못했어요.',
      })
    },
  })

  const recoverPurchases = useCallback(async () => {
    if (Platform.OS !== 'android' || !connected) return
    try {
      await getAvailablePurchases()
    } catch {
      // The hook's onError callback displays a safe, token-free message.
    }
  }, [connected, getAvailablePurchases])

  useEffect(() => {
    if (Platform.OS !== 'android' || !connected || items.length === 0) return

    const productIds = items.flatMap((item) => item.google_play_product_id ?? [])
    void fetchProducts({ skus: productIds, type: 'in-app' }).catch(() => {
      // The hook's onError callback displays a safe, token-free message.
    })
  }, [connected, fetchProducts, items])

  useEffect(() => {
    if (availablePurchases.length === 0) return
    for (const purchase of availablePurchases) {
      void processPurchase(purchase)
    }
  }, [availablePurchases, processPurchase])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void recoverPurchases()
    })
    return () => subscription.remove()
  }, [recoverPurchases])

  useFocusEffect(
    useCallback(() => {
      let active = true

      const load = async () => {
        try {
          await loadBankData(true)
          if (active) await recoverPurchases()
        } catch {
          if (active) {
            setFeedback({ tone: 'error', message: 'Bank 정보를 불러오지 못했어요.' })
          }
        } finally {
          if (active) setLoading(false)
        }
      }

      void load()
      return () => { active = false }
    }, [loadBankData, recoverPurchases]),
  )

  const storeProducts = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  )

  const purchaseProduct = useCallback(async (item: BankItem) => {
    if (Platform.OS !== 'android') {
      setFeedback({ tone: 'info', message: 'CASH 충전은 Android 앱에서 이용할 수 있어요.' })
      return
    }
    if (!profile || profile.role !== 'PARENT' || !item.google_play_product_id) return
    if (!storeProducts.has(item.google_play_product_id)) {
      setFeedback({ tone: 'error', message: 'Google Play에서 이 상품을 찾지 못했어요.' })
      return
    }

    try {
      setProcessingProductId(item.google_play_product_id)
      setFeedback({ tone: 'info', message: 'Google Play 결제창을 열고 있어요.' })
      const obfuscatedAccountId = await createGooglePlayObfuscatedAccountId(profile.authUserId)
      await requestPurchase({
        request: {
          google: {
            skus: [item.google_play_product_id],
            obfuscatedAccountId,
          },
        },
        type: 'in-app',
      })
    } catch (error) {
      handlePurchaseError(error as ExpoPurchaseError)
    }
  }, [handlePurchaseError, profile, requestPurchase, storeProducts])

  const reconnectBilling = useCallback(async () => {
    const reconnected = await reconnect().catch(() => false)
    if (!reconnected) {
      setFeedback({ tone: 'error', message: 'Google Play에 연결하지 못했어요.' })
    }
  }, [reconnect])

  return {
    balance,
    connected,
    feedback,
    items,
    loading,
    processingProductId,
    purchases,
    refreshing,
    storeProducts,
    purchaseProduct,
    reconnectBilling,
    recoverPurchases,
    refreshBankData,
  }
}
