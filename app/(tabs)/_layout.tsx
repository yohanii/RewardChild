// app/(tabs)/_layout.tsx
import { supabase } from '@/src/services/supabaseClient'
import { useNavigation } from '@react-navigation/native'
import { Tabs, useSegments } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'

const questIcon = require('../../assets/icons/quest.png')
const shopIcon = require('../../assets/icons/shop.png')
const bankIcon = require('../../assets/icons/bank.png')

function getTabTitle(segments: string[]) {
  // segments 예: ['(tabs)', 'quests', 'index']
  const key = segments[1]
  if (key === 'quests') return '퀘스트'
  if (key === 'shop') return '상점'
  if (key === 'bank') return '은행'
  return 'RewardChild'
}

function formatCoin(n: number) {
  return (n ?? 0).toLocaleString()
}

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

function useHeaderData(profile: ProfileForTabs | null) {
  const [totalCoin, setTotalCoin] = useState<number>(0)
  const [attendanceCoin, setAttendanceCoin] = useState<number | null>(null)
  const [purchaseCoin, setPurchaseCoin] = useState<number | null>(null)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        if (!profile?.id) {
          if (mounted) {
            setTotalCoin(0)
            setAttendanceCoin(null)
            setPurchaseCoin(null)
          }
          return
        }

        // balances는 (user_id, type) 단위로 row가 존재
        // type: ATTENDANCE(출석), CASH(현금)
        const { data, error } = await supabase
          .from('balances')
          .select('type, amount')
          .eq('user_id', profile.id)
          .in('type', ['ATTENDANCE', 'CASH'])

        if (error) {
          if (mounted) {
            setTotalCoin(0)
            setAttendanceCoin(null)
            setPurchaseCoin(null)
          }
          return
        }

        if (!mounted) return

        const rows = (data ?? []) as Array<{ type: string; amount: number }>
        const attendance =
          rows.find((r) => String(r.type).toUpperCase() === 'ATTENDANCE')
            ?.amount ?? 0
        const cash =
          rows.find((r) => String(r.type).toUpperCase() === 'CASH')?.amount ?? 0

        // 기존 state 이름(purchaseCoin)은 유지하되, 의미는 CASH(현금)로 사용
        setAttendanceCoin(attendance)
        setPurchaseCoin(cash)
        setTotalCoin(attendance + cash)
      } catch {
        if (mounted) {
          setTotalCoin(0)
          setAttendanceCoin(null)
          setPurchaseCoin(null)
        }
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [profile?.id])

  return { totalCoin, attendanceCoin, purchaseCoin }
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

function AppHeader({
  title,
  canGoBack,
  onBack,
  isParent,
  totalCoin,
  attendanceCoin,
  purchaseCoin,
}: {
  title: string
  canGoBack: boolean
  onBack: () => void
  isParent: boolean
  totalCoin: number
  attendanceCoin: number | null
  purchaseCoin: number | null
}) {
  return (
    <View style={styles.headerWrap}>
      <View style={styles.topBar}>
        <Pressable
          onPress={onBack}
          disabled={!canGoBack}
          style={[styles.iconBtn, !canGoBack && styles.iconBtnDisabled]}
          hitSlop={10}
        >
          <Text style={styles.iconText}>{'‹'}</Text>
        </Pressable>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>

        <Pressable
          onPress={() => {
            // TODO: 메뉴(드로어/바텀시트) 연결
            console.log('[header] menu pressed')
          }}
          style={styles.iconBtn}
          hitSlop={10}
        >
          <Text style={styles.iconText}>≡</Text>
        </Pressable>
      </View>

      <View style={styles.balanceBar}>
        {isParent ? (
          <View style={styles.balanceRow}>
            <View style={styles.balanceCol}>
              <Text style={styles.balanceLabel}>출석 코인</Text>
              <Text style={styles.balanceValue}>
                {formatCoin(attendanceCoin ?? totalCoin)}
              </Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceCol}>
              <Text style={styles.balanceLabel}>구매 코인</Text>
              <Text style={styles.balanceValue}>
                {formatCoin(purchaseCoin ?? 0)}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.balanceRowSingle}>
            <Text style={styles.balanceLabel}>내 코인</Text>
            <Text style={styles.balanceValue}>{formatCoin(totalCoin)}</Text>
          </View>
        )}
      </View>
    </View>
  )
}

export default function TabsLayout() {
  const navigation = useNavigation()
  const segments = useSegments()

  const { profile, isParent, loading } = useTabsProfile()
  const { totalCoin, attendanceCoin, purchaseCoin } = useHeaderData(profile)

  const title = getTabTitle(segments as unknown as string[])
  const canGoBack = navigation.canGoBack()

  // role 로딩 전에는 탭 네비게이터를 렌더링하지 않아서,
  // 초기 렌더에서 bank 탭이 숨겨진 상태로 고정되는 현상을 방지
  if (loading) return null

  return (
    <View style={styles.shell}>
      <AppHeader
        title={title}
        canGoBack={canGoBack}
        onBack={() => navigation.goBack()}
        isParent={isParent}
        totalCoin={totalCoin}
        attendanceCoin={attendanceCoin}
        purchaseCoin={purchaseCoin}
      />
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
          sceneContainerStyle: { backgroundColor: '#0F172A' },
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
    </View>
  )
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  headerWrap: {
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  iconBtnDisabled: {
    opacity: 0,
  },
  iconText: {
    color: '#E5E7EB',
    fontSize: 22,
    fontWeight: '800',
    marginTop: -2,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: 12,
    color: '#E5E7EB',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  balanceBar: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceRowSingle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceCol: {
    flex: 1,
  },
  balanceDivider: {
    width: 1,
    height: 34,
    backgroundColor: '#1F2937',
    marginHorizontal: 10,
  },
  balanceLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  balanceValue: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
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