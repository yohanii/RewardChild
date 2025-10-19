import { supabase } from '@/src/services/supabaseClient'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'

export default function Logout() {
  const router = useRouter()

  useEffect(() => {
    const logout = async () => {
      await supabase.auth.signOut()
      localStorage.clear()
      router.replace('/login')
    }

    logout()
  }, [router])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator />
      <Text>로그아웃 중...</Text>
    </View>
  )
}
