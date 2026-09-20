import { BalanceCard } from '@/src/components/common/BalanceCard'
import { useHomeScreen } from '@/src/hooks/useHomeScreen'
import { Ionicons } from '@expo/vector-icons'
import { router, type Href } from 'expo-router'
import React from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function HomeScreen() {
  const { profile, balance, connection, actionableQuestCount, loading } = useHomeScreen()

  if (loading && !profile) {
    return <View style={styles.loadingContainer}><ActivityIndicator color="#2563EB" /></View>
  }
  if (!profile) return null

  const isParent = profile.role === 'PARENT'
  const taskCopy = isParent
    ? actionableQuestCount > 0
      ? `승인을 기다리는 퀘스트가 ${actionableQuestCount}개 있어요.`
      : '새 퀘스트를 만들거나 진행 상황을 확인해 보세요.'
    : actionableQuestCount > 0
      ? `도전할 수 있는 퀘스트가 ${actionableQuestCount}개 있어요.`
      : '새로운 퀘스트가 도착하면 이곳에서 확인할 수 있어요.'

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.greetingRow}>
            <View style={styles.greetingCopy}>
              <Text style={styles.eyebrow}>오늘도 반가워요</Text>
              <Text style={styles.title}>{profile.nickname}님</Text>
            </View>
            <View style={styles.headerActions}>
              <View style={styles.roleBadge}><Text style={styles.roleText}>{isParent ? '부모' : '자녀'}</Text></View>
              <Pressable
                style={styles.settingsButton}
                onPress={() => router.push('/settings' as Href)}
                accessibilityRole="button"
                accessibilityLabel="설정 열기"
              >
                <Ionicons name="settings-outline" size={21} color="#475569" />
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={() => router.push('/balance' as Href)}
            accessibilityRole="button"
            accessibilityLabel="재화 거래 내역 열기"
          >
            <BalanceCard
              label="현재 보유 재화"
              amount={balance.total}
              caption={isParent ? '퀘스트에 사용할 수 있는 전체 재화예요.' : '완료한 퀘스트 보상이 반영된 금액이에요.'}
              parts={[
                { label: '출석 · ATTENDANCE', amount: balance.attendance },
                { label: '구매 · CASH', amount: balance.cash },
              ]}
            />
          </Pressable>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>지금 할 일</Text>
            <Pressable style={styles.primaryCard} onPress={() => router.push('/quests')}>
              <View style={styles.primaryIcon}><Ionicons name="checkmark-circle-outline" size={26} color="#FFFFFF" /></View>
              <View style={styles.primaryCopy}>
                <Text style={styles.primaryTitle}>{isParent ? '퀘스트 관리하기' : '퀘스트 확인하기'}</Text>
                <Text style={styles.primaryDescription}>{taskCopy}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#BFDBFE" />
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>우리 가족</Text>
            <View style={styles.connectionCard}>
              <View style={styles.connectionIcon}><Ionicons name="people-outline" size={22} color="#2563EB" /></View>
              <View style={styles.connectionCopy}>
                <Text style={styles.connectionLabel}>{connection?.label ?? '가족 연결'}</Text>
                <Text style={styles.connectionName}>{connection?.name ?? '연결 정보를 확인해 주세요'}</Text>
              </View>
            </View>
          </View>

          <Pressable style={styles.secondaryCard} onPress={() => router.push('/shop')}>
            <View style={styles.secondaryIcon}><Ionicons name="bag-handle-outline" size={22} color="#0F766E" /></View>
            <View style={styles.secondaryCopy}>
              <Text style={styles.secondaryTitle}>{isParent ? '보상 상점 관리' : '보상 상점 둘러보기'}</Text>
              <Text style={styles.secondaryDescription}>
                {isParent ? '아이에게 보여줄 보상을 확인해 보세요.' : '모은 코인으로 받을 수 있는 보상을 확인해 보세요.'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F7FB' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  content: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: 22 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F7FB' },
  greetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greetingCopy: { flex: 1 },
  eyebrow: { color: '#64748B', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  title: { color: '#0F172A', fontSize: 29, fontWeight: '800', letterSpacing: -0.7 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: '#E0EAFF' },
  roleText: { color: '#1D4ED8', fontSize: 12, fontWeight: '700' },
  settingsButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  section: { gap: 10 },
  sectionTitle: { color: '#334155', fontSize: 16, fontWeight: '800' },
  primaryCard: { minHeight: 112, padding: 18, borderRadius: 22, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#2563EB' },
  primaryIcon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  primaryCopy: { flex: 1 },
  primaryTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  primaryDescription: { color: '#DBEAFE', fontSize: 12, lineHeight: 18, marginTop: 5 },
  connectionCard: { padding: 17, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: '#FFFFFF' },
  connectionIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF' },
  connectionCopy: { flex: 1 },
  connectionLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  connectionName: { color: '#1E293B', fontSize: 16, fontWeight: '700', marginTop: 3 },
  secondaryCard: { padding: 17, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: '#FFFFFF' },
  secondaryIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECFDF5' },
  secondaryCopy: { flex: 1 },
  secondaryTitle: { color: '#1E293B', fontSize: 15, fontWeight: '700' },
  secondaryDescription: { color: '#64748B', fontSize: 12, lineHeight: 18, marginTop: 3 },
})
