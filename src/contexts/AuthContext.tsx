import { User } from '@supabase/supabase-js'
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { AppState, Platform } from 'react-native'
import { supabase } from '../services/supabaseClient'

// Context 타입 정의
interface AuthContextType {
  user: User | null
}

// Provider props 타입 정의
interface AuthProviderProps {
  children: ReactNode
}

// Context 생성 (초기값 null)
const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // 1. 기존 세션 불러오기
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })

    // 2. 로그인 / 로그아웃 감지
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    const appStateSubscription = Platform.OS === 'web'
      ? null
      : AppState.addEventListener('change', (state) => {
        if (state === 'active') supabase.auth.startAutoRefresh()
        else supabase.auth.stopAutoRefresh()
      })

    if (Platform.OS !== 'web' && AppState.currentState === 'active') {
      supabase.auth.startAutoRefresh()
    }

    // 3. 언마운트 시 리스너 해제
    return () => {
      listener.subscription.unsubscribe()
      appStateSubscription?.remove()
      if (Platform.OS !== 'web') supabase.auth.stopAutoRefresh()
    }
  }, [])

  // 4. 전역 상태 제공
  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
}

// 커스텀 훅: 다른 곳에서 user 가져오기
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
