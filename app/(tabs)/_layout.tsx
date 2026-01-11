// app/(tabs)/_layout.tsx
import { supabase } from '@/src/services/supabaseClient'
import { Tabs } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import { Text } from 'react-native'

type ProfileForTabs = {
  id: number
  role: 'PARENT' | 'CHILD'
}

function useTabsProfile() {
  const [profile, setProfile] = useState<ProfileForTabs | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          if (mounted) setProfile(null)
          return
        }

        const { data, error } = await supabase
          .from('users')
          .select('id, role')
          .eq('auth_user_id', user.id)
          .maybeSingle()

        if (error) {
          console.warn('tabs profile load error', error.message)
          if (mounted) setProfile(null)
          return
        }

        if (mounted && data) {
          setProfile({ id: data.id, role: data.role })
        } else if (mounted) {
          setProfile(null)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  const isParent = useMemo(() => profile?.role === 'PARENT', [profile?.role])

  return { profile, isParent, loading }
}

export default function TabsLayout() {
  const { isParent } = useTabsProfile()

  return (
    <Tabs
      screenOptions={{
        headerShown: false, // 헤더는 다음 단계에서 AppShell로 따로 고정할 거라 일단 끔
        tabBarLabelPosition: 'below-icon',
        tabBarStyle: {
          height: 64,
          paddingTop: 8,
          paddingBottom: 10,
        },
      }}
    >
      <Tabs.Screen
        name="quests/index"
        options={{
          title: '홈',
          tabBarIcon: ({ focused }) => <Text>{focused ? '🏠' : '🏡'}</Text>,
        }}
      />

      <Tabs.Screen
        name="shop/index"
        options={{
          title: '상점',
          tabBarIcon: ({ focused }) => <Text>{focused ? '🛍️' : '🛒'}</Text>,
        }}
      />

      {isParent && (
        <Tabs.Screen
          name="bank/index"
          options={{
            title: '은행',
            tabBarIcon: ({ focused }) => <Text>{focused ? '🏦' : '💰'}</Text>,
          }}
        />
      )}
    </Tabs>
  )
}