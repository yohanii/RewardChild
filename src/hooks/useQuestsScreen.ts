// src/hooks/useQuestsScreen.ts
import { supabase } from '@/src/services/supabaseClient'
import type { Profile, Quest } from '@/src/types/quest'
import { showAlert } from '@/src/utils/alert'
import { confirmAsync } from '@/src/utils/confirmAsync'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'

export type CreateQuestPayload = {
  title: string
  content?: string
  reward: number
}

type ActiveRelation = {
  id: number
  parent_id: number
  child_id: number
  status: string
}

type BalanceRow = {
  amount: number
}

const getDDayLabel = (quest: Quest) => {
  // 실제로 due_date가 생기면 여기서 계산
  return 'D-1'
}

export const useQuestsScreen = () => {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [balance, setBalance] = useState<number>(0)
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [mutating, setMutating] = useState(false)

  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null)
  const [modalVisible, setModalVisible] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)

      // 1) auth
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.warn(authError)
        showAlert('오류', '로그인 정보를 불러오지 못했어요.')
        return
      }
      if (!authData.user) {
        router.replace('/login')
        return
      }

      // 2) profile
      const { data: profileRow, error: profileError } = await supabase
        .from('users')
        .select('id, role, nickname')
        .eq('auth_user_id', authData.user.id)
        .maybeSingle<Profile>()

      if (profileError || !profileRow) {
        console.warn(profileError)
        showAlert('오류', '프로필 정보를 불러오지 못했어요.')
        return
      }
      setProfile(profileRow)

      const { data: balanceRows, error: balanceError } = await supabase
        .from('balances')
        .select('amount')
        .eq('user_id', profileRow.id)

      if (balanceError) {
        console.warn(balanceError)
      }

      const totalBalance =
        (balanceRows ?? []).reduce((sum, row) => sum + (row.amount ?? 0), 0)

      setBalance(totalBalance)

      // 4) quests (RLS로 필터)
      const { data: questRows, error: questError } = await supabase
        .from('quests')
        .select('*')
        .order('created_at', { ascending: false })

      if (questError) {
        console.warn(questError)
        showAlert('오류', '퀘스트 목록을 불러오지 못했어요.')
        return
      }

      setQuests((questRows ?? []) as Quest[])
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load]),
  )

  useEffect(() => {
    load()
  }, [load])

  const openQuest = (quest: Quest) => {
    setSelectedQuest(quest)
    setModalVisible(true)
  }

  const closeQuest = () => {
    setModalVisible(false)
    setSelectedQuest(null)
  }

  const deleteQuest = async (quest: Quest) => {
    const ok = await confirmAsync('퀘스트 삭제', '정말로 이 퀘스트를 삭제할까요?')
    if (!ok) return

    try {
      setMutating(true)
      const { error } = await supabase.from('quests').delete().eq('id', quest.id)
      if (error) {
        console.warn(error)
        showAlert('삭제 실패', '퀘스트를 삭제하는 중 오류가 발생했어요.')
        return
      }
      setQuests((prev) => prev.filter((q) => q.id !== quest.id))
      if (selectedQuest?.id === quest.id) {
        closeQuest()
      }
    } finally {
      setMutating(false)
    }
  }

  const childRequestQuest = async (quest: Quest) => {
    const ok = await confirmAsync(
      '퀘스트 요청',
      '이 퀘스트를 완료 요청 상태로 바꿀까요?\n부모님께 승인 요청이 가요.',
    )
    if (!ok) return

    try {
      setMutating(true)
      const { error } = await supabase
        .from('quests')
        .update({ status: 'REQUESTED' })
        .eq('id', quest.id)

      if (error) {
        console.warn(error)
        showAlert('요청 실패', '퀘스트 상태를 변경하는 중 오류가 발생했어요.')
        return
      }
      setQuests((prev) =>
        prev.map((q) => (q.id === quest.id ? { ...q, status: 'REQUESTED' } : q)),
      )
      if (selectedQuest?.id === quest.id) {
        setSelectedQuest((prev) => (prev ? { ...prev, status: 'REQUESTED' } : prev))
      }
    } finally {
      setMutating(false)
    }
  }

  const parentApproveQuest = async (quest: Quest) => {
    const ok = await confirmAsync(
      '퀘스트 승인',
      '퀘스트를 완료 처리하고, 보상을 지급할까요?',
    )
    if (!ok) return

    try {
      setMutating(true)
      const now = new Date().toISOString()
      const { error } = await supabase
        .from('quests')
        .update({ status: 'COMPLETED', completed_at: now })
        .eq('id', quest.id)

      if (error) {
        console.warn(error)
        showAlert('승인 실패', '퀘스트 승인 중 오류가 발생했어요.')
        return
      }

      setQuests((prev) =>
        prev.map((q) =>
          q.id === quest.id ? { ...q, status: 'COMPLETED', completed_at: now } : q,
        ),
      )
      if (selectedQuest?.id === quest.id) {
        setSelectedQuest((prev) =>
          prev ? { ...prev, status: 'COMPLETED', completed_at: now } : prev,
        )
      }
    } finally {
      setMutating(false)
    }
  }

    const createQuest = async (payload: CreateQuestPayload): Promise<boolean> => {
    if (!profile) {
      showAlert('오류', '프로필 정보를 찾을 수 없어요.')
      return false
    }

    if (profile.role !== 'PARENT') {
      showAlert('권한 없음', '퀘스트는 부모만 등록할 수 있어요.')
      return false
    }

    try {
      setMutating(true)

      // 1) 활성 관계 찾기 (MVP: 1:1 관계 기준)
      const { data: relation, error: relationError } = await supabase
        .from('relations')
        .select('id, parent_id, child_id, status')
        .eq('parent_id', profile.id)
        .eq('status', 'ACTIVE')
        .maybeSingle<ActiveRelation>()

      if (relationError) {
        console.warn(relationError)
        showAlert('오류', '관계 정보를 불러오는 중 문제가 발생했어요.')
        return false
      }

      if (!relation) {
        showAlert('관계 없음', '활성화된 부모-자녀 관계가 없어요.')
        return false
      }

      // 2) quests insert
      const { data, error } = await supabase
        .from('quests')
        .insert([
          {
            relation_id: relation.id,
            parent_id: profile.id,
            child_id: relation.child_id,
            title: payload.title,
            content: payload.content ?? null,
            reward: payload.reward,
            status: 'REGISTERED',
          },
        ])
        .select('*')
        .single<Quest>()

      if (error) {
        console.warn(error)
        showAlert('등록 실패', '퀘스트를 등록하는 중 오류가 발생했어요.')
        return false
      }

      // 3) 상태 업데이트 (새 퀘스트를 맨 위에 추가)
      setQuests((prev) => (data ? [data, ...prev] : prev))

      return true
    } finally {
      setMutating(false)
    }
  }


  return {
    profile,
    balance,
    quests,
    loading,
    mutating,
    selectedQuest,
    modalVisible,
    openQuest,
    closeQuest,
    deleteQuest,
    childRequestQuest,
    parentApproveQuest,
    getDDayLabel,
    createQuest,
  }
}
