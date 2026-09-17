import { supabase } from '@/src/services/supabaseClient'
import { showAlert } from '@/src/utils/alert'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'

export default function Logout() {
  const router = useRouter()

  useEffect(() => {
    let active = true

    const logout = async () => {
      const { error } = await supabase.auth.signOut()
      if (!active) return
      if (error) {
        showAlert('로그아웃 실패', '잠시 후 다시 시도해 주세요.')
        router.back()
        return
      }
      router.replace('/login')
    }

    logout().catch((error) => {
      console.warn('logout error', error)
      if (active) {
        showAlert('로그아웃 실패', '잠시 후 다시 시도해 주세요.')
        router.back()
      }
    })

    return () => { active = false }
  }, [router])

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#2563EB" />
      <Text style={styles.text}>로그아웃 중...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: '#F6F7FB' },
  text: { color: '#64748B', fontSize: 14, fontWeight: '600' },
})
