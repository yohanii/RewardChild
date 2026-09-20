import { supabase } from '@/src/services/supabaseClient'
import type { Enums, Tables } from '@/src/types/database.types'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useRef, useState } from 'react'

export type BalanceSummary = {
  attendance: number
  cash: number
  total: number
}

export type BalanceTransaction = Pick<
  Tables<'transactions'>,
  'id' | 'amount' | 'type' | 'reference_type' | 'reference_id' | 'note' | 'created_at'
>

const TRANSACTION_LIMIT = 50

export function getTransactionLabel(
  type: Enums<'transaction_type'>,
  referenceType: Enums<'reference_type'> | null,
) {
  switch (type) {
    case 'ATTENDANCE_REWARD':
      return '출석 충전'
    case 'INITIAL_CREDIT':
      return '시작 재화 지급'
    case 'QUEST_REWARD':
      return '퀘스트 보상'
    case 'SHOP_PURCHASE':
      return '상점 구매'
    case 'BANK_PURCHASE':
      return 'Bank 충전'
    case 'REFUND_ATTENDANCE':
    case 'REFUND_CASH':
      return '퀘스트 환불'
    case 'SPEND_ATTENDANCE':
    case 'SPEND_CASH':
      if (referenceType === 'QUEST') return '퀘스트 등록'
      if (referenceType === 'SHOP_PURCHASE') return '상점 구매'
      return '재화 사용'
    case 'ADJUSTMENT':
      return '재화 조정'
  }
}

export function getTransactionSource(referenceType: Enums<'reference_type'> | null) {
  switch (referenceType) {
    case 'QUEST':
      return '퀘스트'
    case 'SHOP_PURCHASE':
      return '보상 상점'
    case 'BANK_PURCHASE':
      return 'Bank'
    default:
      return null
  }
}

export function useBalanceScreen() {
  const [balance, setBalance] = useState<BalanceSummary>({ attendance: 0, cash: 0, total: 0 })
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasLoadedRef = useRef(false)
  const requestRef = useRef<Promise<void> | null>(null)

  const load = useCallback((mode: 'focus' | 'refresh' | 'retry' = 'focus') => {
    if (requestRef.current) {
      if (mode === 'refresh') setRefreshing(true)
      return requestRef.current
    }

    if (!hasLoadedRef.current) setLoading(true)
    if (mode === 'refresh') setRefreshing(true)
    setError(null)

    const request = (async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!authData.user) {
        router.replace('/login')
        throw new Error('No auth user')
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authData.user.id)
        .maybeSingle()
      if (profileError) throw profileError
      if (!profile) throw new Error('No profile row in users')

      const [balanceResult, transactionResult] = await Promise.all([
        supabase
          .from('balances')
          .select('type, amount')
          .eq('user_id', profile.id)
          .in('type', ['ATTENDANCE', 'CASH']),
        supabase
          .from('transactions')
          .select('id, amount, type, reference_type, reference_id, note, created_at')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(TRANSACTION_LIMIT),
      ])

      if (balanceResult.error) throw balanceResult.error
      if (transactionResult.error) throw transactionResult.error

      const balanceRows = balanceResult.data ?? []
      const attendance = balanceRows.find((row) => row.type === 'ATTENDANCE')?.amount ?? 0
      const cash = balanceRows.find((row) => row.type === 'CASH')?.amount ?? 0

      setBalance({ attendance, cash, total: attendance + cash })
      setTransactions(transactionResult.data ?? [])
      hasLoadedRef.current = true
    })().catch((loadError) => {
      console.warn('balance history load error', loadError)
      setError('거래 내역을 불러오지 못했어요.')
    }).finally(() => {
      setLoading(false)
      setRefreshing(false)
      requestRef.current = null
    })

    requestRef.current = request
    return request
  }, [])

  useFocusEffect(useCallback(() => {
    void load('focus')
  }, [load]))

  return {
    balance,
    transactions,
    loading,
    refreshing,
    error,
    refresh: () => load('refresh'),
    retry: () => load('retry'),
  }
}
