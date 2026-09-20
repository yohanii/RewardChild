import { ScreenLoading, StateCard } from '@/src/components/common/ScreenState'
import { useOnRelationActivated } from '@/src/hooks/useOnRelationActivated'
import { showAlert } from '@/src/utils/alert'
import { classifyRelations } from '@/src/utils/relationState'
import { router } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { Button, StyleSheet, Text, TextInput, View } from 'react-native'
import { supabase } from '../../src/services/supabaseClient'
import type { Enums } from '../../src/types/database.types'

type OnboardedProfile = {
  id: number
  role: Exclude<Enums<'user_role'>, 'DEFAULT'>
  nickname: string
  tag: string
}

export default function RelationConnectScreen() {
  const [profile, setProfile] = useState<OnboardedProfile | null>(null)
  const [childTag, setChildTag] = useState('')
  const [waitingRelationId, setWaitingRelationId] = useState<number | null>(null)
  const [hasMultiplePendingRelations, setHasMultiplePendingRelations] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ✅ 1. relation이 ACTIVE 되면 자동 이동
  useOnRelationActivated(profile?.id ?? 0, profile?.role ?? 'PARENT', () => {
    router.replace('/home')
  }, { relationId: waitingRelationId ?? undefined })

  // ✅ 2. 내 프로필 불러오기
  const loadProfile = useCallback(async () => {
    setInitialLoading(true)
    setError(null)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) return router.replace('/login')

      const { data, error: profileError } = await supabase
        .from('users')
        .select('id, role, nickname, tag')
        .eq('auth_user_id', user.id)
        .single()

      if (profileError || !data) throw profileError ?? new Error('PROFILE_NOT_FOUND')
      if (!data.nickname || !data.tag) {
        router.replace('/onboarding/nickname')
        return
      }
      if (data.role === 'DEFAULT') {
        router.replace('/role-select')
        return
      }

      setProfile({
        id: data.id,
        role: data.role,
        nickname: data.nickname,
        tag: data.tag,
      })
    } catch (loadError) {
      console.warn('relation connect profile load error', loadError)
      setError('연결 정보를 불러오지 못했어요.')
    } finally {
      setInitialLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  // ✅ 3. 부모가 이전 요청(PENDING) 보낸 적 있는지 확인
  useEffect(() => {
    (async () => {
      if (!profile || profile.role !== 'PARENT') return

      const { data, error } = await supabase
        .from('relations')
        .select('id,status')
        .eq('parent_id', profile.id)
        .in('status', ['PENDING', 'ACTIVE'])

      if (error) {
        console.warn('relation state load error', error)
        setError('연결 상태를 불러오지 못했어요.')
        return
      }

      const activeState = classifyRelations(data?.filter((relation) => relation.status === 'ACTIVE'))
      if (activeState.kind !== 'NONE') {
        router.replace('/home')
        return
      }

      const pendingState = classifyRelations(data?.filter((relation) => relation.status === 'PENDING'))
      setWaitingRelationId(pendingState.kind === 'SINGLE' ? pendingState.relation.id : null)
      setHasMultiplePendingRelations(pendingState.kind === 'MULTIPLE')
    })()
  }, [profile])

  // ✅ 4. 부모가 연결 요청 보내기
  const handleConnect = async () => {
    if (loading) return
    if (!profile) return showAlert('오류', '프로필 정보를 찾을 수 없습니다.')
    const [nickname, tag] = (childTag ?? '').split('#')
    if (!nickname || !tag) return showAlert('닉네임#태그 형식으로 입력해주세요')

    setLoading(true)
    const { data: child, error: childErr } = await supabase
      .rpc('find_child_by_tag', { _nickname: nickname.trim(), _tag: tag.trim() })
      .maybeSingle()

    if (childErr?.message === 'CHILD_SEARCH_RATE_LIMITED') {
      setLoading(false)
      return showAlert('검색 요청이 너무 많습니다.', '10분 후 다시 시도해주세요.')
    }

    if (childErr || !child) {
      setLoading(false)
      return showAlert('존재하지 않는 자녀입니다.')
    }

    const { data: existing } = await supabase
      .from('relations')
      .select('id,status')
      .eq('parent_id', profile.id)
      .eq('child_id', child.id)
      .maybeSingle()

    if (existing) {
      if (existing.status === 'ACTIVE') {
        setLoading(false)
        return showAlert('이미 연결된 자녀입니다.')
      }
      if (existing.status === 'PENDING') {
        setWaitingRelationId(existing.id)
        setLoading(false)
        return showAlert('이미 요청 대기 중입니다.')
      }
      if (existing.status === 'BLOCKED') {
        setLoading(false)
        return showAlert('차단된 관계는 다시 연결할 수 없습니다.')
      }
    }

    const { data: inserted, error } = await supabase.rpc('create_relation_request', {
      p_child_id: child.id,
    })

    setLoading(false)
    if (error || !inserted) return showAlert('연결 실패', '잠시 후 다시 시도해 주세요.')

    setWaitingRelationId(inserted.id)
    showAlert('연결 요청 완료', '자녀의 승인을 기다려주세요.')
  }

  const handleCancel = async () => {
    if (!waitingRelationId || loading) return

    setLoading(true)
    const { error } = await supabase.rpc('cancel_relation_request', {
      p_relation_id: waitingRelationId,
    })
    setLoading(false)

    if (error) return showAlert('요청 취소 실패', '잠시 후 다시 시도해 주세요.')
    setWaitingRelationId(null)
    setHasMultiplePendingRelations(false)
    showAlert('연결 요청을 취소했습니다.')
  }

  if (initialLoading && !profile) return <ScreenLoading label="연결 정보를 불러오는 중..." />
  if (!profile) {
    return (
      <StateCard
        fullScreen
        icon="cloud-offline-outline"
        title={error ?? '연결 정보를 표시할 수 없어요.'}
        description="네트워크 연결을 확인하고 다시 시도해 주세요."
        actionLabel="다시 시도"
        onAction={loadProfile}
      />
    )
  }

  const isParent = profile.role === 'PARENT'

  return (
    <View style={styles.container}>
      {error ? (
        <StateCard
          icon="cloud-offline-outline"
          title={error}
          description="다시 조회한 뒤 연결을 진행해 주세요."
          actionLabel="다시 시도"
          onAction={loadProfile}
        />
      ) : null}
      <Text style={styles.myTag}>
        내 코드: {profile.nickname}#{profile.tag}
      </Text>

      {isParent ? (
        <>
          <Text style={styles.title}>자녀 닉네임#태그를 입력하세요</Text>
          <TextInput
            placeholder="예: 민준#A3F2"
            value={childTag}
            onChangeText={setChildTag}
            style={styles.input}
            autoCapitalize="none"
          />
          <Button title={loading ? '요청 중...' : '연결 요청'} onPress={handleConnect} disabled={loading || Boolean(error)} />

          {waitingRelationId && !loading && (
            <View style={styles.waitingArea}>
              <Text style={styles.waitingText}>
                요청이 전송되었습니다. 자녀가 수락하면 자동으로 이동합니다.
              </Text>
              <Button title="요청 취소" onPress={handleCancel} color="#DC2626" />
            </View>
          )}
          {hasMultiplePendingRelations && !loading && (
            <View style={styles.waitingArea}>
              <Text style={styles.waitingText}>
                여러 연결 요청이 대기 중입니다. 개별 요청 관리 기능을 준비 중이에요.
              </Text>
            </View>
          )}
        </>
      ) : (
        <>
          <Text style={styles.title}>부모님의 연결 요청을 기다리는 중...</Text>
          <Button title="요청 보기" onPress={() => router.push('/relation/requests')} />
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  myTag: { fontSize: 18, fontWeight: '600', marginBottom: 24, textAlign: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#aaa', borderRadius: 8, padding: 12, marginBottom: 12 },
  waitingArea: { marginTop: 16, gap: 10 },
  waitingText: { textAlign: 'center' },
})
