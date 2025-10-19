import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native'
import { supabase } from '../src/services/supabaseClient'

// 간단한 역할별 화면 컴포넌트
function ParentHome({ nickname }: { nickname: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>👨‍👩‍👧 부모님 홈</Text>
      <Text style={styles.subtitle}>{nickname} 님, 환영합니다!</Text>

      <View style={styles.section}>
        <Button title="자녀 관리하기" onPress={() => router.push('/relation/requests')} />
      </View>
      <View style={styles.section}>
        <Button title="퀘스트 등록하기" onPress={() => router.push('/quests/create')} />
      </View>
      <View style={styles.section}>
        <Button title="상점 관리" onPress={() => router.push('/shop/manage')} />
      </View>
    </View>
  )
}

function ChildHome({ nickname }: { nickname: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎮 모험가 홈</Text>
      <Text style={styles.subtitle}>{nickname} 님, 오늘도 힘내요!</Text>

      <View style={styles.section}>
        <Button title="퀘스트 보기" onPress={() => router.push('/quests')} />
      </View>
      <View style={styles.section}>
        <Button title="상점 입장" onPress={() => router.push('/shop')} />
      </View>
      <View style={styles.section}>
        <Button title="내 재화 보기" onPress={() => router.push('/balance')} />
      </View>
    </View>
  )
}

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<{ nickname: string; role: 'PARENT' | 'CHILD' } | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('nickname, role')
        .eq('auth_user_id', user.id)
        .single()

      if (error || !data) {
        console.error(error)
        router.replace('/login')
        return
      }

      setProfile(data)
      setLoading(false)
    }

    loadProfile()
  }, [])

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator />
      </View>
    )
  }

  if (!profile) return null

  return profile.role === 'PARENT' ? (
    <ParentHome nickname={profile.nickname} />
  ) : (
    <ChildHome nickname={profile.nickname} />
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 24 },
  section: { marginBottom: 12 },
})
