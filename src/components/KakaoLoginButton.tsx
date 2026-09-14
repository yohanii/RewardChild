import { makeRedirectUri } from 'expo-auth-session'
import { router } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import { supabase } from '../services/supabaseClient'
import { showAlert } from '../utils/alert'

WebBrowser.maybeCompleteAuthSession()

export default function KakaoLoginButton() {
  const [loading, setLoading] = React.useState(false)
  const loginInFlight = React.useRef(false)

  const handleLogin = async () => {
    if (loginInFlight.current) return

    loginInFlight.current = true
    setLoading(true)
    try {
      const redirectTo = makeRedirectUri({
        scheme: 'rewardchild',
        path: 'auth/callback',
      })
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: {
            scope: '',
            ...(__DEV__ ? { prompt: 'login' } : {}),
          },
        },
      })

      if (error || !data.url) throw error ?? new Error('OAUTH_URL_NOT_FOUND')

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
      if (result.type === 'cancel' || result.type === 'dismiss') {
        showAlert('로그인 취소', '카카오 로그인이 취소되었어요.')
        return
      }
      if (result.type !== 'success') {
        throw new Error('OAUTH_CALLBACK_NOT_RECEIVED')
      }

      const callbackUrl = new URL(result.url)
      const callbackError = callbackUrl.searchParams.get('error_description')
        ?? callbackUrl.searchParams.get('error')
      if (callbackError) throw new Error(callbackError)

      const code = callbackUrl.searchParams.get('code')
      if (!code) throw new Error('OAUTH_CODE_NOT_FOUND')

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      if (exchangeError) throw exchangeError

      router.replace('/')
    } catch {
      showAlert('로그인 실패', '카카오 로그인을 완료하지 못했어요. 다시 시도해 주세요.')
    } finally {
      loginInFlight.current = false
      setLoading(false)
    }
  }

  return (
    <TouchableOpacity
      style={[styles.button, loading && styles.buttonDisabled]}
      onPress={handleLogin}
      disabled={loading}
    >
      <Text style={styles.text}>{loading ? '로그인 중...' : '카카오로 로그인'}</Text>
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
  buttonDisabled: {
    opacity: 0.6,
  },
  text: {
    fontWeight: '600',
    color: '#3C1E1E',
  },
})
