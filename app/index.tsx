import { router } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { supabase } from '../src/services/supabaseClient'

export default function Index() {
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        // 로그인 안 됨 → 로그인 화면으로
        router.replace('/login')
        return
      }

      // 로그인된 사용자 정보 확인
      const { data: profile } = await supabase
        .from('users')
        .select('nickname, tag, role, id')
        .eq('auth_user_id', session.user.id)
        .single()

      if (!profile) {
        // 아직 users 테이블에 없음 (이론상 거의 없음)
        router.replace('/login')
        return
      }

      // 닉네임 미설정 → 닉네임 설정 페이지로
      if (!profile.nickname) {
        router.replace('/onboarding/nickname')
        return
      }

      // 역할 미선택 → 역할 선택 페이지로
      if (!profile.role || profile.role === 'DEFAULT') {
        router.replace('/role-select')
        return
      }

      // 관계 여부 확인
      const { data: relation } = await supabase
        .from('relations')
        .select('*')
        .or(`parent_id.eq.${profile.id},child_id.eq.${profile.id}`)
        .maybeSingle()

      if (!relation) {
        // 관계 없으면 가족 연결 페이지
        router.replace('/relation/connect')
      } else {
        // 관계 있으면 홈으로
        router.replace('/home')
      }
    }

    checkSession()
  }, [])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator />
    </View>
  )
}
