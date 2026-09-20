import { ScreenLoading, StateCard } from '@/src/components/common/ScreenState'
import { useOnRelationActivated } from '@/src/hooks/useOnRelationActivated'
import { showAlert } from '@/src/utils/alert'
import { router } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { Button, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { supabase } from '../../src/services/supabaseClient'
import type { Tables } from '../../src/types/database.types'

type RelationRequest = Pick<Tables<'relations'>, 'id' | 'parent_id' | 'status'> & {
  parent: Pick<Tables<'users'>, 'nickname' | 'tag'> | null
}

type RequestProfile = Pick<Tables<'users'>, 'id' | 'nickname' | 'tag'>

export default function RelationRequestsScreen() {
  const [profile, setProfile] = useState<RequestProfile | null>(null)
  const [requests, setRequests] = useState<RelationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useOnRelationActivated(profile?.id ?? 0, 'CHILD', () => {
    // 실시간 이벤트로도 이동(중복 방지는 훅 내부에서 처리)
    router.replace('/home')
  })

  const loadRequests = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const { data: userData, error: authError } = await supabase.auth.getUser()
      const user = userData?.user
      if (authError || !user) {
        router.replace('/login')
        return
      }

      const { data: child, error: childError } = await supabase
        .from('users')
        .select('id, nickname, tag')
        .eq('auth_user_id', user.id)
        .single()

      if (childError || !child) throw childError ?? new Error('PROFILE_NOT_FOUND')

      const { data, error } = await supabase
        .from('relations')
        .select('id, parent_id, status')
        .eq('child_id', child.id)
        .eq('status', 'PENDING')

      if (error) throw error

      const relationRows = data ?? []
      const parentIds = relationRows.map((relation) => relation.parent_id)
      const { data: parents, error: parentsError } = parentIds.length > 0
        ? await supabase.rpc('get_family_profiles', { p_user_ids: parentIds })
        : { data: [], error: null }

      if (parentsError) throw parentsError

      const parentById = new Map((parents ?? []).map((parent) => [parent.id, parent]))
      setProfile(child)
      setRequests(relationRows.map((relation) => ({
        ...relation,
        parent: parentById.get(relation.parent_id) ?? null,
      })))
    } catch (loadError) {
      console.warn('relation requests load error', loadError)
      setError('연결 요청을 불러오지 못했어요.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadRequests()
  }, [loadRequests])

  const handleApprove = async (relationId: number) => {
    const { error } = await supabase.rpc('approve_relation_request', {
      p_relation_id: relationId,
    })

    if (error) showAlert('승인 실패', '잠시 후 다시 시도해 주세요.')
    else {
      showAlert('가족 연결 완료!')
      router.replace('/home')
    }
  }

  const handleReject = async (relationId: number) => {
    const { error } = await supabase.rpc('reject_relation_request', {
      p_relation_id: relationId,
    })

    if (error) showAlert('거절 실패', '잠시 후 다시 시도해 주세요.')
    else {
      setRequests((current) => current.filter((request) => request.id !== relationId))
      showAlert('연결 요청을 거절했습니다.')
    }
  }

  if (loading && !profile) return <ScreenLoading label="연결 요청을 불러오는 중..." />
  if (!profile) {
    return (
      <StateCard
        fullScreen
        icon="cloud-offline-outline"
        title={error ?? '연결 요청을 표시할 수 없어요.'}
        description="네트워크 연결을 확인하고 다시 시도해 주세요."
        actionLabel="다시 시도"
        onAction={() => loadRequests()}
      />
    )
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadRequests(true)} tintColor="#2563EB" colors={['#2563EB']} />}
    >
      <Text style={styles.myTag}>
        내 코드: {profile.nickname ?? '닉네임 미설정'}#{profile.tag ?? '태그 미설정'}
      </Text>

      <Text style={styles.title}>부모님의 연결 요청</Text>

      {error ? (
        <StateCard
          icon="cloud-offline-outline"
          title={error}
          description="기존 요청은 유지했어요. 다시 조회해 주세요."
          actionLabel="다시 시도"
          onAction={() => loadRequests()}
        />
      ) : requests.length === 0 ? (
        <StateCard
          icon="mail-open-outline"
          title="현재 연결 요청이 없어요."
          description="부모님이 요청을 보내면 이곳에 표시됩니다."
        />
      ) : (
        requests.map((r) => {
          const label = r.parent
            ? `${r.parent.nickname ?? '닉네임 미설정'}#${r.parent.tag ?? '태그 미설정'}`
            : '알 수 없는 사용자'
          return (
            <View key={r.id} style={styles.card}>
              <Text>부모님: {label}</Text>
              <View style={styles.actions}>
                <Button title="수락" onPress={() => handleApprove(r.id)} />
                <Button title="거절" onPress={() => handleReject(r.id)} color="#DC2626" />
              </View>
            </View>
          )
        })
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  myTag: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  card: { marginBottom: 12, padding: 12, borderWidth: 1, borderRadius: 8 },
  actions: { marginTop: 8, gap: 6 },
})
