import { router } from 'expo-router'
import React, { useEffect } from 'react'
import { Text, View } from 'react-native'
import KakaoLoginButton from '../src/components/KakaoLoginButton'
import { supabase } from '../src/services/supabaseClient'

export default function Login() {
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Login :: 로그인 시도 session = ', session)
        if (session) {
          console.log('Login :: 로그인 성공:', session.user)
          // 로그인 성공 → index(세션체크)로 리다이렉트
          router.replace('/')
        }
      }
    )
    return () => authListener.subscription.unsubscribe()
  }, [])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>
        RewardChild 로그인
      </Text>
      <KakaoLoginButton />
    </View>
  )
}
