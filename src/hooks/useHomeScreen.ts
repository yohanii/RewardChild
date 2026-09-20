import { supabase } from '@/src/services/supabaseClient'
import { claimDailyAttendance } from '@/src/services/attendanceService'
import type { Enums } from '@/src/types/database.types'
import { showAlert } from '@/src/utils/alert'
import { classifyRelations } from '@/src/utils/relationState'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useRef, useState } from 'react'

type HomeRole = Exclude<Enums<'user_role'>, 'DEFAULT'>

export type HomeProfile = {
  id: number
  nickname: string
  role: HomeRole
}

type HomeBalance = {
  attendance: number
  cash: number
  total: number
}

type HomeConnection = {
  label: string
  name: string
}

export function useHomeScreen() {
  const [profile, setProfile] = useState<HomeProfile | null>(null)
  const [balance, setBalance] = useState<HomeBalance>({
    attendance: 0,
    cash: 0,
    total: 0,
  })
  const [connection, setConnection] = useState<HomeConnection | null>(null)
  const [actionableQuestCount, setActionableQuestCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasLoadedRef = useRef(false)
  const loadInFlightRef = useRef<Promise<void> | null>(null)

  const load = useCallback((mode: 'focus' | 'refresh' | 'retry' = 'focus') => {
    if (loadInFlightRef.current) {
      if (mode === 'refresh') setRefreshing(true)
      return loadInFlightRef.current
    }
    if (!hasLoadedRef.current) setLoading(true)
    if (mode === 'refresh') setRefreshing(true)
    setError(null)

    const request = (async () => {
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
          .select('id, nickname, role')
          .eq('auth_user_id', user.id)
          .maybeSingle()

        if (profileError || !profileRow) {
          throw profileError ?? new Error('PROFILE_NOT_FOUND')
        }

        if (!profileRow.nickname) {
          router.replace('/onboarding/nickname')
          return
        }

        if (profileRow.role === 'DEFAULT') {
          router.replace('/role-select')
          return
        }

        const nextProfile: HomeProfile = {
          id: profileRow.id,
          nickname: profileRow.nickname,
          role: profileRow.role,
        }

        const relationColumn = nextProfile.role === 'PARENT' ? 'parent_id' : 'child_id'
        const questColumn = nextProfile.role === 'PARENT' ? 'parent_id' : 'child_id'
        const actionableStatuses =
          nextProfile.role === 'PARENT' ? ['REQUESTED' as const] : ['REGISTERED' as const, 'REJECTED' as const]

        let attendanceGranted = 0
        if (nextProfile.role === 'PARENT') {
          try {
            attendanceGranted = await claimDailyAttendance()
          } catch (error) {
            console.warn('daily attendance claim error', error)
          }
        }

        const [balanceResult, relationResult, questResult] = await Promise.all([
          supabase
            .from('balances')
            .select('type, amount')
            .eq('user_id', nextProfile.id)
            .in('type', ['ATTENDANCE', 'CASH']),
          supabase
            .from('relations')
            .select('id, parent_id, child_id')
            .eq(relationColumn, nextProfile.id)
            .eq('status', 'ACTIVE')
            .limit(2),
          supabase
            .from('quests')
            .select('id', { count: 'exact', head: true })
            .eq(questColumn, nextProfile.id)
            .in('status', actionableStatuses),
        ])

        if (balanceResult.error) throw balanceResult.error
        if (relationResult.error) throw relationResult.error
        if (questResult.error) throw questResult.error

        const balanceRows = balanceResult.data ?? []
        const attendance =
          balanceRows.find((row) => row.type === 'ATTENDANCE')?.amount ?? 0
        const cash = balanceRows.find((row) => row.type === 'CASH')?.amount ?? 0

        let nextConnection: HomeConnection | null = null
        const relationState = classifyRelations(relationResult.data)
        if (relationState.kind === 'SINGLE') {
          const relation = relationState.relation
          const isParent = nextProfile.role === 'PARENT'
          const relatedUserId = isParent ? relation.child_id : relation.parent_id
          const { data: relatedUser, error: relatedUserError } = await supabase
            .rpc('get_family_profiles', { p_user_ids: [relatedUserId] })
            .maybeSingle()

          if (relatedUserError) {
            console.warn('home family profile load error', relatedUserError.message)
          }

          nextConnection = {
            label: isParent ? '연결된 자녀' : '연결된 부모',
            name: relatedUser?.nickname ?? (isParent ? '우리 아이' : '우리 부모님'),
          }
        } else if (relationState.kind === 'MULTIPLE') {
          nextConnection = {
            label: '가족 관계',
            name: '여러 가족이 연결되어 있어요',
          }
        }

        setProfile(nextProfile)
        setBalance({ attendance, cash, total: attendance + cash })
        setConnection(nextConnection)
        setActionableQuestCount(questResult.count ?? 0)
        hasLoadedRef.current = true

        if (attendanceGranted > 0) {
          showAlert('출석 완료', `ATTENDANCE ${attendanceGranted}개를 충전했어요.`)
        }
      })().catch((loadError) => {
        console.warn('home load error', loadError)
        setError('홈 정보를 불러오지 못했어요.')
      }).finally(() => {
        setLoading(false)
        setRefreshing(false)
        loadInFlightRef.current = null
      })

    loadInFlightRef.current = request
    return request
  }, [])

  useFocusEffect(useCallback(() => {
    void load('focus')
  }, [load]))

  return {
    profile,
    balance,
    connection,
    actionableQuestCount,
    loading,
    refreshing,
    error,
    refresh: () => load('refresh'),
    retry: () => load('retry'),
  }
}
