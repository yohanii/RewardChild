import { supabase } from '@/src/services/supabaseClient'
import { claimDailyAttendance } from '@/src/services/attendanceService'
import type { Enums } from '@/src/types/database.types'
import { showAlert } from '@/src/utils/alert'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'

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

  useFocusEffect(
    useCallback(() => {
      let active = true

      const load = async () => {
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
          console.warn('home profile load error', profileError?.message)
          router.replace('/login')
          return
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
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('quests')
            .select('id', { count: 'exact', head: true })
            .eq(questColumn, nextProfile.id)
            .in('status', actionableStatuses),
        ])

        if (balanceResult.error) {
          console.warn('home balance load error', balanceResult.error.message)
        }
        if (relationResult.error) {
          console.warn('home relation load error', relationResult.error.message)
        }
        if (questResult.error) {
          console.warn('home quest count load error', questResult.error.message)
        }

        const balanceRows = balanceResult.data ?? []
        const attendance =
          balanceRows.find((row) => row.type === 'ATTENDANCE')?.amount ?? 0
        const cash = balanceRows.find((row) => row.type === 'CASH')?.amount ?? 0

        let nextConnection: HomeConnection | null = null
        const relation = relationResult.data
        if (relation) {
          const isParent = nextProfile.role === 'PARENT'
          const relatedUserId = isParent ? relation.child_id : relation.parent_id
          const { data: relatedUser } = await supabase
            .from('users')
            .select('nickname')
            .eq('id', relatedUserId)
            .maybeSingle()

          nextConnection = {
            label: isParent ? '연결된 자녀' : '연결된 부모',
            name: relatedUser?.nickname ?? (isParent ? '우리 아이' : '우리 부모님'),
          }
        }

        if (!active) return

        setProfile(nextProfile)
        setBalance({ attendance, cash, total: attendance + cash })
        setConnection(nextConnection)
        setActionableQuestCount(questResult.count ?? 0)
        setLoading(false)

        if (attendanceGranted > 0) {
          showAlert('출석 완료', `ATTENDANCE ${attendanceGranted}개를 충전했어요.`)
        }
      }

      load().catch((error) => {
        console.warn('home load error', error)
        if (active) setLoading(false)
      })

      return () => {
        active = false
      }
    }, []),
  )

  return { profile, balance, connection, actionableQuestCount, loading }
}
