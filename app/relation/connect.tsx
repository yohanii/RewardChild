import { useOnRelationActivated } from '@/src/hooks/useOnRelationActivated'
import { showAlert } from '@/src/utils/alert'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Button, StyleSheet, Text, TextInput, View } from 'react-native'
import { supabase } from '../../src/services/supabaseClient'

type ChildResult = { id: number; nickname: string; tag: string }

export default function RelationConnectScreen() {
  const [profile, setProfile] = useState<{ id: number; role: string; nickname: string; tag: string } | null>(null)
  const [childTag, setChildTag] = useState('')
  const [waitingRelationId, setWaitingRelationId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  // ✅ 1. relation이 ACTIVE 되면 자동 이동
  useOnRelationActivated(profile?.id ?? 0, 'PARENT', () => {
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

      if (data) setProfile(data)
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
        .order('id', { ascending: false })
        .limit(1)

      if (error) {
        console.error(error)
        return
      }

      const relation = data?.[0]
      if (!relation) return
      if (relation.status === 'ACTIVE') router.replace('/home')
      else setWaitingRelationId(relation.id)
    })()
  }, [profile])

  // ✅ 4. 부모가 연결 요청 보내기
  const handleConnect = async () => {
    if (loading) return
    const [nickname, tag] = (childTag ?? '').split('#')
    if (!nickname || !tag) return showAlert('닉네임#태그 형식으로 입력해주세요')

    setLoading(true)
    const { data: child, error: childErr } = await supabase
      .rpc('find_child_by_tag' as const, { _nickname: nickname.trim(), _tag: tag.trim() })
      .maybeSingle<ChildResult>()

    if (childErr || !child) {
      setLoading(false)
      return showAlert('존재하지 않는 자녀입니다.')
    }

    const { data: existing } = await supabase
      .from('relations')
      .select('id,status')
      .eq('parent_id', profile?.id)
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
    }

    const { data: inserted, error } = await supabase
      .from('relations')
      .insert({ parent_id: profile?.id, child_id: child.id, status: 'PENDING' })
      .select('id')
      .single()

    setLoading(false)
    if (error) return showAlert('연결 실패', error.message)

    setWaitingRelationId(inserted.id)
    showAlert('연결 요청 완료', '자녀의 승인을 기다려주세요.')
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
            <Text style={{ marginTop: 16, textAlign: 'center' }}>
              요청이 전송되었습니다. 자녀가 수락하면 자동으로 이동합니다.
            </Text>
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
})
