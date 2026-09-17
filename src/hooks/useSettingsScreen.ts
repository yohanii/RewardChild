import { supabase } from '@/src/services/supabaseClient'
import type { Enums } from '@/src/types/database.types'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'

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
  const [blockingRelationId, setBlockingRelationId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)

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

    if (profileError || !profileRow) {
      console.warn('settings profile load error', profileError?.message)
      setLoading(false)
      return
    }

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

    if (relationError) {
      console.warn('settings relation load error', relationError.message)
    }

    const rows = relationRows ?? []
    const relatedUserIds = rows.map((relation) =>
      nextProfile.role === 'PARENT' ? relation.child_id : relation.parent_id,
    )
    const relatedUsers = relatedUserIds.length > 0
      ? await supabase.rpc('get_family_profiles', { p_user_ids: relatedUserIds })
      : { data: [], error: null }

    if (relatedUsers.error) {
      console.warn('settings related users load error', relatedUsers.error.message)
    }

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
    setLoading(false)
  }, [])

  useFocusEffect(
    useCallback(() => {
      load().catch((error) => {
        console.warn('settings load error', error)
        setLoading(false)
      })
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

    await load()
    return true
  }, [blockingRelationId, load])

  return { profile, relations, loading, blockingRelationId, blockRelation }
}
