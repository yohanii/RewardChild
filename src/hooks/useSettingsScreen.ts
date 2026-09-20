import { supabase } from '@/src/services/supabaseClient'
import type { Enums } from '@/src/types/database.types'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useRef, useState } from 'react'

type SettingsRole = Exclude<Enums<'user_role'>, 'DEFAULT'>

export type SettingsProfile = {
  id: number
  nickname: string
  tag: string
  role: SettingsRole
}

export type ActiveRelation = {
  id: number
  relatedNickname: string | null
  relatedTag: string | null
}

export function useSettingsScreen() {
  const [profile, setProfile] = useState<SettingsProfile | null>(null)
  const [relations, setRelations] = useState<ActiveRelation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [blockingRelationId, setBlockingRelationId] = useState<number | null>(null)
  const hasLoadedRef = useRef(false)

  const load = useCallback(async (mode: 'focus' | 'refresh' | 'retry' = 'focus') => {
    if (!hasLoadedRef.current) setLoading(true)
    if (mode === 'refresh') setRefreshing(true)
    setError(null)

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData.user) {
        router.replace('/login')
        return
      }

    const { data: profileRow, error: profileError } = await supabase
      .from('users')
      .select('id, nickname, tag, role')
      .eq('auth_user_id', authData.user.id)
      .maybeSingle()

      if (profileError || !profileRow) throw profileError ?? new Error('PROFILE_NOT_FOUND')

    if (!profileRow.nickname || !profileRow.tag || profileRow.role === 'DEFAULT') {
      router.replace('/')
      return
    }

    const nextProfile: SettingsProfile = {
      id: profileRow.id,
      nickname: profileRow.nickname,
      tag: profileRow.tag,
      role: profileRow.role,
    }
    const relationColumn = nextProfile.role === 'PARENT' ? 'parent_id' : 'child_id'
    const { data: relationRows, error: relationError } = await supabase
      .from('relations')
      .select('id, parent_id, child_id')
      .eq(relationColumn, nextProfile.id)
      .eq('status', 'ACTIVE')
      .order('id')

      if (relationError) throw relationError

    const rows = relationRows ?? []
    const relatedUserIds = rows.map((relation) =>
      nextProfile.role === 'PARENT' ? relation.child_id : relation.parent_id,
    )
    const relatedUsers = relatedUserIds.length > 0
      ? await supabase.rpc('get_family_profiles', { p_user_ids: relatedUserIds })
      : { data: [], error: null }

      if (relatedUsers.error) throw relatedUsers.error

    const relatedUserById = new Map((relatedUsers.data ?? []).map((user) => [user.id, user]))
    setProfile(nextProfile)
    setRelations(rows.map((relation) => {
      const relatedUserId = nextProfile.role === 'PARENT' ? relation.child_id : relation.parent_id
      const relatedUser = relatedUserById.get(relatedUserId)
      return {
        id: relation.id,
        relatedNickname: relatedUser?.nickname ?? null,
        relatedTag: relatedUser?.tag ?? null,
      }
    }))
      hasLoadedRef.current = true
    } catch (loadError) {
      console.warn('settings load error', loadError)
      setError('설정 정보를 불러오지 못했어요.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void load('focus')
    }, [load]),
  )

  const blockRelation = useCallback(async (relationId: number) => {
    if (blockingRelationId !== null) return false

    setBlockingRelationId(relationId)
    const { error } = await supabase.rpc('block_relation', { p_relation_id: relationId })
    setBlockingRelationId(null)

    if (error) {
      console.warn('block relation error', error.message)
      return false
    }

    await load('retry')
    return true
  }, [blockingRelationId, load])

  return {
    profile,
    relations,
    loading,
    refreshing,
    error,
    blockingRelationId,
    blockRelation,
    refresh: () => load('refresh'),
    retry: () => load('retry'),
  }
}
