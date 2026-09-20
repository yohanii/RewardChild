import { ScreenLoading } from '@/src/components/common/ScreenState'
import { supabase } from '@/src/services/supabaseClient'
import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useState } from 'react'
import { StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type TabRole = 'PARENT' | 'CHILD' | null

function tabIcon(
  activeName: React.ComponentProps<typeof Ionicons>['name'],
  inactiveName: React.ComponentProps<typeof Ionicons>['name'],
) {
  return function Icon({ color, size, focused }: { color: string; size: number; focused: boolean }) {
    return <Ionicons name={focused ? activeName : inactiveName} size={size} color={color} />
  }
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets()
  const [role, setRole] = useState<TabRole>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const loadRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (active) setLoading(false)
        return
      }

      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      if (active) {
        setRole(data?.role === 'PARENT' || data?.role === 'CHILD' ? data.role : null)
        setLoading(false)
      }
    }

    loadRole().catch(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  if (loading) {
    return <ScreenLoading label="앱 정보를 불러오는 중..." />
  }

  return (
    <>
      <StatusBar style="dark" />
      <Tabs
        initialRouteName="home/index"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#2563EB',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
          tabBarStyle: [styles.tabBar, { height: 62 + insets.bottom, paddingBottom: Math.max(insets.bottom, 8) }],
          sceneStyle: styles.scene,
        }}
      >
        <Tabs.Screen name="home/index" options={{ title: '홈', tabBarIcon: tabIcon('home', 'home-outline') }} />
        <Tabs.Screen name="quests/index" options={{ title: '퀘스트', tabBarIcon: tabIcon('checkmark-circle', 'checkmark-circle-outline') }} />
        <Tabs.Screen name="shop/index" options={{ title: '상점', tabBarIcon: tabIcon('bag-handle', 'bag-handle-outline') }} />
        <Tabs.Screen
          name="bank/index"
          options={{
            title: '은행',
            href: role === 'PARENT' ? '/bank' : null,
            tabBarIcon: tabIcon('card', 'card-outline'),
          }}
        />
      </Tabs>
    </>
  )
}

const styles = StyleSheet.create({
  scene: { backgroundColor: '#F6F7FB' },
  tabBar: {
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 8,
  },
  tabItem: { paddingVertical: 2 },
  tabLabel: { fontSize: 11, fontWeight: '700', marginTop: 2 },
})
