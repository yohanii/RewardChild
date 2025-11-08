import { useOnRelationActivated } from '@/src/hooks/useOnRelationActivated'
import { showAlert } from '@/src/utils/alert'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Button, StyleSheet, Text, View } from 'react-native'
import { supabase } from '../../src/services/supabaseClient'

// Supabase가 내려줄 수 있는 원시 parent 형태: 객체 | 배열 | null
type RawParent =
  | { nickname: string; tag: string }
  | { nickname: string; tag: string }[]
  | null

type RawRelationRow = {
  id: number
  parent_id: number
  status: string
  parent: RawParent
}

interface RelationRequest {
  id: number
  parent_id: number
  status: string
  parent: { nickname: string; tag: string } | null
}

// 배열/객체 케이스 모두 안전하게 정규화
const normalizeParent = (
  p: RawParent
): { nickname: string; tag: string } | null => {
  if (!p) return null
  return Array.isArray(p) ? p[0] ?? null : p
}

export default function RelationRequestsScreen() {
  const [profile, setProfile] = useState<{ id: number; nickname: string; tag: string } | null>(null)
  const [requests, setRequests] = useState<RelationRequest[]>([])

  useOnRelationActivated(profile?.id ?? 0, 'CHILD', () => {
    // 실시간 이벤트로도 이동(중복 방지는 훅 내부에서 처리)
    router.replace('/home')
  })

  useEffect(() => {
    const loadRequests = async () => {
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
        // FK 이름 또는 컬럼명으로 관계 명시: 둘 중 프로젝트에 맞는 쪽 사용
        .select('id, parent_id, status, parent:users!parent_id(nickname, tag)')
        .eq('child_id', child.id)
        .eq('status', 'PENDING')
        .returns<RawRelationRow[]>()

      if (error) {
        console.error(error)
        return
      }

      const normalized: RelationRequest[] = (data ?? []).map(r => ({
        id: r.id,
        parent_id: r.parent_id,
        status: r.status,
        parent: normalizeParent(r.parent),
      }))

      setRequests(normalized)
      console.log('requests(normalized) = ', normalized)
    }

    loadRequests()
  }, [])

  const handleApprove = async (relationId: number) => {
    const { error } = await supabase
      .from('relations')
      .update({ status: 'ACTIVE' })
      .eq('id', relationId)

    if (error) showAlert('승인 실패', error.message)
    else {
      showAlert('가족 연결 완료!')
      router.replace('/home')
    }
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
        requests.map((r) => {
          const label = r.parent ? `${r.parent.nickname}#${r.parent.tag}` : '알 수 없는 사용자'
          return (
            <View key={r.id} style={styles.card}>
              <Text>부모님: {label}</Text>
              <Button title="수락" onPress={() => handleApprove(r.id)} />
            </View>
          )
        })
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
