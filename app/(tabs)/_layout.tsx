import { ScreenLoading } from '@/src/components/common/ScreenState'
import { supabase } from '@/src/services/supabaseClient'
import { colors, radius } from '@/src/theme/tokens'
import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type TabRole = 'PARENT' | 'CHILD' | null

function tabIcon(
  activeName: React.ComponentProps<typeof Ionicons>['name'],
  inactiveName: React.ComponentProps<typeof Ionicons>['name'],
) {
  return function Icon({ color, size, focused }: { color: string; size: number; focused: boolean }) {
    return (
      <View style={[styles.iconFrame, focused && styles.iconFrameActive]}>
        <Ionicons name={focused ? activeName : inactiveName} size={size} color={color} />
      </View>
    )
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
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIconStyle: styles.tabIcon,
          tabBarItemStyle: styles.tabItem,
          tabBarStyle: [styles.tabBar, { height: 58 + insets.bottom, paddingBottom: Math.max(insets.bottom, 6) }],
          sceneStyle: styles.scene,
        }}
      >
        <Tabs.Screen name="home/index" options={{ title: '홈', tabBarIcon: tabIcon('home', 'home-outline') }} />
        <Tabs.Screen name="quests/index" options={{ title: '퀘스트', tabBarIcon: tabIcon('shield', 'shield-outline') }} />
        <Tabs.Screen name="shop/index" options={{ title: '상점', tabBarIcon: tabIcon('storefront', 'storefront-outline') }} />
        <Tabs.Screen
          name="bank/index"
          options={{
            title: '은행',
            href: role === 'PARENT' ? '/bank' : null,
            tabBarIcon: tabIcon('business', 'business-outline'),
          }}
        />
      </Tabs>
    </>
  )
}

const styles = StyleSheet.create({
  scene: { backgroundColor: colors.background },
  tabBar: {
    paddingTop: 4,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.accentGold,
    shadowColor: colors.wood,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 12,
  },
  tabItem: { paddingTop: 1 },
  tabIcon: { marginTop: 0 },
  tabLabel: { fontSize: 11, lineHeight: 14, fontWeight: '800', marginTop: 1 },
  iconFrame: {
    width: 40,
    height: 30,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  iconFrameActive: {
    backgroundColor: colors.goldSoft,
    borderColor: colors.accentGold,
    shadowColor: colors.accentGold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.24,
    shadowRadius: 5,
    elevation: 3,
  },
})
