import { useEffect, useState } from 'react'
import { Alert, Button, StyleSheet, Text, View } from 'react-native'
import { supabase } from '../../src/services/supabaseClient'

// ✅ 1️⃣ relations + parent users 조합 데이터 타입 정의
interface RelationRequest {
  relation_id: number
  parent_id: number
  status: string
  users: {
    nickname: string
    tag: string
  }[]
}

export default function RelationRequestsScreen() {
  // ✅ 2️⃣ useState 제네릭으로 타입 명시
  const [profile, setProfile] = useState<{ id: number; nickname: string; tag: string } | null>(null)
  const [requests, setRequests] = useState<RelationRequest[]>([])

  useEffect(() => {
    const loadRequests = async () => {
      // ✅ 3️⃣ user가 null일 수 있으므로 체크
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) {
        console.warn('⚠️ 로그인된 유저가 없습니다.')
        return
      }

      const { data: child } = await supabase
        .from('users')
        .select('id, nickname, tag')
        .eq('auth_user_id', user.id)
        .single()

      if (!child) return
      setProfile(child)

      const { data, error } = await supabase
        .from('relations')
        .select('relation_id, parent_id, status, users!relations_parent_id_fkey(nickname, tag)')
        .eq('child_id', child.id)
        .eq('status', 'PENDING')

      if (error) {
        console.error(error)
        return
      }

      // ✅ 4️⃣ 타입 지정된 배열에 data를 안전하게 대입
      setRequests(data as RelationRequest[])
    }

    loadRequests()
  }, [])

  const handleApprove = async (relationId: number) => {
    const { error } = await supabase
      .from('relations')
      .update({ status: 'ACTIVE' })
      .eq('relation_id', relationId)

    if (error) Alert.alert('승인 실패', error.message)
    else Alert.alert('가족 연결 완료!')
  }

  if (!profile) return null

  return (
    <View style={styles.container}>
      <Text style={styles.myTag}>
        내 코드: {profile.nickname}#{profile.tag}
      </Text>

      <Text style={styles.title}>부모님의 연결 요청</Text>

      {requests.length === 0 ? (
        <Text>현재 연결 요청이 없습니다.</Text>
      ) : (
        requests.map((r) => (
          <View key={r.relation_id} style={styles.card}>
            <Text>
              부모님: {r.users[0].nickname}#{r.users[0].tag}
            </Text>
            <Button title="수락" onPress={() => handleApprove(r.relation_id)} />
          </View>
        ))
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  myTag: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  card: { marginBottom: 12, padding: 12, borderWidth: 1, borderRadius: 8 },
})
