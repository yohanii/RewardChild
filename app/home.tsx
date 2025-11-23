import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../src/services/supabaseClient';

// 간단한 역할별 화면 컴포넌트
function ParentHome({ nickname, balance }: { nickname: string; balance: number | null }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>👨‍👩‍👧 부모님 홈</Text>
      <Text style={styles.subtitle}>{nickname} 님, 환영합니다!</Text>
      <View style={styles.balanceBox}>
        <Text style={styles.balanceLabel}>보유 코인</Text>
        <Text style={styles.balanceValue}>{balance ?? 0} COIN</Text>
      </View>

      <View style={styles.section}>
        <Button title="자녀 관리하기" onPress={() => router.push('/relation/requests')} />
      </View>
      <View style={styles.section}>
        <Button title="퀘스트 보기" onPress={() => router.push('/quests')} />
      </View>
      <View style={styles.section}>
        <Button title="상점 관리" onPress={() => router.push('/shop/manage')} />
      </View>
    </View>
  )
}

function ChildHome({ nickname, balance }: { nickname: string; balance: number | null }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎮 모험가 홈</Text>
      <Text style={styles.subtitle}>{nickname} 님, 오늘도 힘내요!</Text>
      <View style={styles.balanceBox}>
        <Text style={styles.balanceLabel}>보유 코인</Text>
        <Text style={styles.balanceValue}>{balance ?? 0} COIN</Text>
      </View>

      <View style={styles.section}>
        <Button title="퀘스트 보기" onPress={() => router.push('/quests')} />
      </View>
      <View style={styles.section}>
        <Button title="상점 입장" onPress={() => router.push('/shop')} />
      </View>
    </View>
  )
}

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<{ id: number; nickname: string; role: 'PARENT' | 'CHILD' } | null>(null)
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('id, nickname, role')
        .eq('auth_user_id', user.id)
        .single()

      if (error || !data) {
        console.error(error)
        router.replace('/login')
        return
      }

      setProfile(data)

      const { data: balanceRows, error: balanceError } = await supabase
        .from('balances')
        .select('amount')
        .eq('user_id', user.id)

      if (balanceError) {
        console.warn(balanceError)
      }

      const totalBalance =
        (balanceRows ?? []).reduce((sum, row) => sum + (row.amount ?? 0), 0)

      setBalance(totalBalance)

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
    <ParentHome nickname={profile.nickname} balance={balance} />
  ) : (
    <ChildHome nickname={profile.nickname} balance={balance} />
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 24 },
  balanceBox: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f2f6ff',
    marginBottom: 24,
  },
  balanceLabel: { fontSize: 14, color: '#4a4a4a' },
  balanceValue: { marginTop: 4, fontSize: 24, fontWeight: 'bold', color: '#1c48ff' },
  section: { marginBottom: 12 },
})
