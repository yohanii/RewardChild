import { useOnRelationActivated } from '@/src/hooks/useOnRelationActivated'
import { showAlert } from '@/src/utils/alert'
import { classifyRelations } from '@/src/utils/relationState'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
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

  // ✅ 1. relation이 ACTIVE 되면 자동 이동
  useOnRelationActivated(profile?.id ?? 0, profile?.role ?? 'PARENT', () => {
    router.replace('/home')
  }, { relationId: waitingRelationId ?? undefined })

  // ✅ 2. 내 프로필 불러오기
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.replace('/login')

      const { data } = await supabase
        .from('users')
        .select('id, role, nickname, tag')
        .eq('auth_user_id', user.id)
        .single()

      if (!data) return
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
    })()
  }, [])

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
        console.error(error)
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
    if (error || !inserted) return showAlert('연결 실패', error?.message ?? '연결 요청 결과가 없습니다.')

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

    if (error) return showAlert('요청 취소 실패', error.message)
    setWaitingRelationId(null)
    setHasMultiplePendingRelations(false)
    showAlert('연결 요청을 취소했습니다.')
  }

  if (!profile) return null

  const isParent = profile.role === 'PARENT'

  return (
    <View style={styles.container}>
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
          <Button title={loading ? '요청 중...' : '연결 요청'} onPress={handleConnect} disabled={loading} />

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
