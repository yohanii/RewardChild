// app/(tabs)/_layout.tsx
import { supabase } from '@/src/services/supabaseClient'
import { Tabs } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'

const questIcon = require('../../assets/icons/quest.png')
const shopIcon = require('../../assets/icons/shop.png')
const bankIcon = require('../../assets/icons/bank.png')

type ProfileForTabs = {
  id: number
  role: string
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
          setProfile({ id: data.id, role: String(data.role) })
          console.log('[tabs] loaded role =', String(data.role))
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

  const isParent = useMemo(() => {
    const role = (profile?.role ?? '').toUpperCase()
    return role === 'PARENT'
  }, [profile?.role])

  return { profile, isParent, loading }
}

function TabIcon({
  source,
  focused,
  label,
}: {
  source: any
  focused: boolean
  label: string
}) {
  return (
    <View style={styles.tabIconWrap}>
      <Image
        source={source}
        resizeMode="contain"
        style={[styles.tabIconImage, focused && styles.tabIconImageFocused]}
      />

      {focused && (
        <View style={styles.tabLabelPill}>
          <Text style={styles.tabLabelText}>{label}</Text>
        </View>
      )}
    </View>
  )
}

export default function TabsLayout() {
  const { isParent, loading } = useTabsProfile()

  // role 로딩 전에는 탭 네비게이터를 렌더링하지 않아서,
  // 초기 렌더에서 bank 탭이 숨겨진 상태로 고정되는 현상을 방지
  if (loading) return null

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // ✅ 기본 라벨 숨김 (선택된 탭만 커스텀으로 표시)
        tabBarStyle: {
          height: 92,
          paddingTop: 10,
          paddingBottom: 14,
          backgroundColor: '#0F172A',
          borderTopWidth: 1,
          borderTopColor: '#111827',
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
      }}
    >
      <Tabs.Screen
        name="quests/index"
        options={{
          title: '홈',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={questIcon} focused={focused} label="홈" />
          ),
        }}
      />

      <Tabs.Screen
        name="shop/index"
        options={{
          title: '상점',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={shopIcon} focused={focused} label="상점" />
          ),
        }}
      />

      {isParent && (
        <Tabs.Screen
          name="bank/index"
          options={{
            title: '은행',
            tabBarIcon: ({ focused }) => (
              <TabIcon source={bankIcon} focused={focused} label="은행" />
            ),
          }}
        />
      )}
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: 78,
  },
  tabIconImage: {
    width: 60,
    height: 60,
    opacity: 0.78,
  },
  tabIconImageFocused: {
    width: 60,
    height: 60,
    opacity: 1,
  },
  tabLabelPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E5E7EB',
  },
})