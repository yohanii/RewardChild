import React from 'react'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import { supabase } from '../services/supabaseClient'

export default function KakaoLoginButton() {
  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: 'rewardchild://auth/callback', // Expo Router redirect
        queryParams: {
            scope: '',
        },
      },
    })
    if (error) console.error('Kakao login error:', error.message)
  }

  return (
    <TouchableOpacity style={styles.button} onPress={handleLogin}>
      <Text style={styles.text}>카카오로 로그인</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FEE500',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
    color: '#3C1E1E',
  },
})
