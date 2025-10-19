import React, { useEffect } from 'react'
import { Text, View } from 'react-native'
import KakaoLoginButton from '../src/components/KakaoLoginButton'
import { supabase } from '../src/services/supabaseClient'

export default function Index() {
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          console.log('✅ 로그인 성공:', session.user)
        }
      }
    )
    return () => authListener.subscription.unsubscribe()
  }, [])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>
        RewardChild 로그인 테스트
      </Text>
      <KakaoLoginButton />
    </View>
  )
}
