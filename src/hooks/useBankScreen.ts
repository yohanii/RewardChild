import {
  BANK_PRODUCT_IDS,
} from '@/src/services/googlePlayBilling'
import { supabase } from '@/src/services/supabaseClient'
import type { Enums, Tables } from '@/src/types/database.types'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import {
  useBankBillingProvider,
  type BankBillingErrorKind,
} from './useBankBillingProvider'

export type BankItem = Pick<
  Tables<'bank_items'>,
  'id' | 'title' | 'cash_amount' | 'google_play_product_id' | 'sort_order'
>

export type BankPurchase = Pick<
  Tables<'bank_purchases'>,
  'id' | 'cash_granted' | 'status' | 'provider' | 'created_at'
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

function billingErrorFeedback(kind: BankBillingErrorKind): BankFeedback {
  if (kind === 'cancelled') {
    return { tone: 'info', message: '결제가 취소되었어요.' }
  }
  if (kind === 'pending') {
    return {
      tone: 'info',
      message: '결제가 처리 중입니다. 완료되면 CASH에 반영돼요.',
    }
  }
  if (kind === 'network') {
    return {
      tone: 'error',
      message: '네트워크 연결을 확인한 뒤 다시 시도해 주세요.',
    }
  }
  return {
    tone: 'error',
    message: '결제를 처리하지 못했어요. 잠시 후 다시 시도해 주세요.',
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
        .select('id, cash_granted, status, provider, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    if (balanceResult.error) throw balanceResult.error
    if (itemResult.error) throw itemResult.error
    if (purchaseResult.error) throw purchaseResult.error

    const balanceRows = balanceResult.data ?? []
    setProfile(nextProfile)
    setBalance({
      attendance: balanceRows.find((row) => row.type === 'ATTENDANCE')?.amount ?? 0,
      cash: balanceRows.find((row) => row.type === 'CASH')?.amount ?? 0,
    })

    const nextItems = itemResult.data ?? []
    setItems(nextItems)
    setPurchases(purchaseResult.data ?? [])
  }, [])

  const refreshBankData = useCallback(async () => {
    setRefreshing(true)
    setFeedback(null)
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

  const handlePurchaseSuccess = useCallback(async (result: {
    cashGranted: number
    consumeStatus: 'NOT_STARTED' | 'PENDING' | 'FAILED' | 'CONSUMED'
  }) => {
    await loadBankData()
    setProcessingProductId(null)
    setFeedback({
      tone: 'success',
      message: result.consumeStatus === 'CONSUMED'
        ? `${result.cashGranted.toLocaleString()} CASH가 충전되었어요.`
        : `${result.cashGranted.toLocaleString()} CASH가 반영되었어요. 결제 마무리는 자동으로 재시도됩니다.`,
    })
  }, [loadBankData])

  const handlePurchaseError = useCallback((kind: BankBillingErrorKind) => {
    setProcessingProductId(null)
    setFeedback(billingErrorFeedback(kind))
  }, [])

  const productIds = useMemo(
    () => items.flatMap((item) => item.google_play_product_id ?? []),
    [items],
  )

  const {
    mode: billingMode,
    connected,
    products: storeProducts,
    purchase: purchaseWithProvider,
    recover: recoverWithProvider,
    reconnect: reconnectProvider,
  } = useBankBillingProvider({
    authUserId: profile?.authUserId,
    productIds,
    onSuccess: handlePurchaseSuccess,
    onError: handlePurchaseError,
  })

  const recoverPurchases = useCallback(async () => {
    try {
      await recoverWithProvider()
    } catch {
      handlePurchaseError('network')
    }
  }, [handlePurchaseError, recoverWithProvider])

  const retryBankData = useCallback(async () => {
    setLoading(true)
    setFeedback(null)
    try {
      await loadBankData()
      await recoverPurchases()
    } catch {
      setFeedback({ tone: 'error', message: 'Bank 정보를 불러오지 못했어요.' })
    } finally {
      setLoading(false)
    }
  }, [loadBankData, recoverPurchases])

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

  const purchaseProduct = useCallback(async (item: BankItem) => {
    if (!profile || profile.role !== 'PARENT' || !item.google_play_product_id) return
    if (!storeProducts.has(item.google_play_product_id)) {
      setFeedback({ tone: 'error', message: '결제 provider에서 이 상품을 찾지 못했어요.' })
      return
    }

    try {
      setProcessingProductId(item.google_play_product_id)
      setFeedback({
        tone: 'info',
        message: billingMode === 'mock'
          ? '개발용 Mock 결제를 처리하고 있어요.'
          : 'Google Play 결제창을 열고 있어요.',
      })
      await purchaseWithProvider(item.google_play_product_id)
    } catch {
      handlePurchaseError('failed')
    }
  }, [billingMode, handlePurchaseError, profile, purchaseWithProvider, storeProducts])

  const reconnectBilling = useCallback(async () => {
    const reconnected = await reconnectProvider().catch(() => false)
    if (!reconnected) {
      setFeedback({ tone: 'error', message: 'Google Play에 연결하지 못했어요.' })
    }
  }, [reconnectProvider])

  return {
    ready: profile !== null,
    balance,
    billingMode,
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
    retryBankData,
    refreshBankData,
  }
}
