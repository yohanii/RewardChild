import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native'
import { supabase } from '../../src/services/supabaseClient'


type ChildResult = {
  id: number
  nickname: string
  tag: string
}

export default function RelationConnectScreen() {
  const [profile, setProfile] = useState<{ id: number; role: string; nickname: string; tag: string } | null>(null)
  const [childTag, setChildTag] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.replace('/login')

      const { data } = await supabase
        .from('users')
        .select('id, role, nickname, tag')
        .eq('auth_user_id', user.id)
        .single()

      if (data) setProfile(data)
    }
    loadProfile()
  }, [])

  const handleConnect = async () => {
    const [nickname, tag] = childTag.split('#')
    if (!nickname || !tag) {
      Alert.alert('닉네임#태그 형식으로 입력해주세요')
      return
    }

    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) {
      Alert.alert('로그인이 만료되었습니다. 다시 로그인해주세요.')
      router.replace('/login')
      return
    }

    // ✅ RPC 결과 타입 지정
    const { data: child, error: childErr } = await supabase
      .rpc('find_child_by_tag' as const, { _nickname: nickname.trim(), _tag: tag.trim() })
      .maybeSingle<ChildResult>()

    if (childErr) {
      console.error('find_child_by_tag error:', childErr)
      Alert.alert('조회 중 오류가 발생했습니다.')
      return
    }

    if (!child) {
      Alert.alert('존재하지 않는 자녀입니다.')
      return
    }

    if (!profile?.id) {
      Alert.alert('내 정보가 없습니다. 다시 로그인해주세요.')
      return
    }

    const { data: existing } = await supabase
      .from('relations')
      .select('*')
      .eq('parent_id', profile.id)
      .eq('child_id', child.id)
      .maybeSingle()

    if (existing) {
      if (existing.status === 'ACTIVE') return Alert.alert('이미 연결된 자녀입니다.')
      if (existing.status === 'PENDING') return Alert.alert('이미 요청 대기 중입니다.')
    }

    const { error: insertErr } = await supabase.from('relations').insert({
      parent_id: profile.id,
      child_id: child.id,
      status: 'PENDING',
    })

    if (insertErr) {
      console.error(insertErr)
      Alert.alert('연결 실패', insertErr.message)
    } else {
      Alert.alert('연결 요청 완료', '자녀의 승인을 기다려주세요.')
    }
  }


  if (!profile) return null

  return (
    <View style={styles.container}>
      {/* 내 식별 태그 항상 표시 */}
      <Text style={styles.myTag}>
        내 코드: {profile.nickname}#{profile.tag}
      </Text>

      {profile.role === 'PARENT' ? (
        <>
          <Text style={styles.title}>자녀 닉네임#태그를 입력하세요</Text>
          <TextInput
            placeholder="예: 민준#A3F2"
            value={childTag}
            onChangeText={setChildTag}
            style={styles.input}
          />
          <Button title="연결 요청" onPress={handleConnect} />
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
  myTag: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
})
