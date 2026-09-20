import {
  CoinBadge,
  FantasyCard,
  type FantasyIconName,
  ParchmentCard,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
  StatusChip,
} from '@/src/components/common/FantasyPrimitives'
import { ScreenLoading, StateCard } from '@/src/components/common/ScreenState'
import { useHomeScreen } from '@/src/hooks/useHomeScreen'
import { colors, layout, radius, shadows, spacing, typography } from '@/src/theme/tokens'
import { Ionicons } from '@expo/vector-icons'
import { router, type Href } from 'expo-router'
import React from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type LocationCardProps = {
  icon: FantasyIconName
  eyebrow: string
  title: string
  description: string
  accent: string
  iconBackground: string
  onPress: () => void
}

function LocationCard({
  icon,
  eyebrow,
  title,
  description,
  accent,
  iconBackground,
  onPress,
}: LocationCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}로 이동`}
      onPress={onPress}
      style={({ pressed }) => [styles.locationPressable, pressed && styles.pressed]}
    >
      <FantasyCard style={[styles.locationCard, { borderLeftColor: accent }]}>
        <View style={[styles.locationIcon, { backgroundColor: iconBackground }]}>
          <Ionicons name={icon} size={23} color={accent} />
        </View>
        <View style={styles.locationCopy}>
          <Text style={[styles.locationEyebrow, { color: accent }]}>{eyebrow}</Text>
          <Text style={styles.locationTitle}>{title}</Text>
          <Text style={styles.locationDescription}>{description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={19} color={colors.textSecondary} />
      </FantasyCard>
    </Pressable>
  )
}

export default function HomeScreen() {
  const { profile, balance, connection, actionableQuestCount, loading, refreshing, error, refresh, retry } = useHomeScreen()

  if (loading && !profile) {
    return <ScreenLoading label="길드 소식을 불러오는 중..." />
  }
  if (!profile) {
    return (
      <StateCard
        fullScreen
        icon="cloud-offline-outline"
        title={error ?? '길드 정보를 표시할 수 없어요.'}
        description="네트워크 연결을 확인하고 다시 시도해 주세요."
        actionLabel="다시 시도"
        onAction={retry}
      />
    )
  }

  const isParent = profile.role === 'PARENT'
  const roleAccent = isParent ? colors.parent : colors.child
  const roleSoft = isParent ? colors.parentSoft : colors.childSoft
  const roleTitle = isParent ? '길드 상인 · 부모' : '리트리버 용사 · 자녀'
  const heroCopy = isParent
    ? '오늘도 길드를 꼼꼼히 돌볼 시간이에요.'
    : '새로운 의뢰와 모험이 기다리고 있어요!'
  const dailyMessage = isParent
    ? '좋은 경험은 언제나 따뜻한 관심과 꼼꼼한 준비에서 시작돼요.'
    : '작은 도전이 멋진 용사를 만들어요. 오늘도 힘차게 출발!'
  const taskCopy = isParent
    ? actionableQuestCount > 0
      ? `완료 보고 ${actionableQuestCount}건이 확인을 기다리고 있어요.`
      : '대기 중인 완료 보고가 없어요. 새 의뢰를 준비해 보세요.'
    : actionableQuestCount > 0
      ? `도전하거나 다시 보고할 의뢰가 ${actionableQuestCount}건 있어요.`
      : '지금 바로 확인할 의뢰가 없어요. 다음 모험을 기다려 보세요.'

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={roleAccent}
            colors={[roleAccent]}
          />
        )}
      >
        <View style={styles.content}>
          {error ? (
            <StateCard
              icon="cloud-offline-outline"
              title={error}
              description="기존 길드 정보는 유지했어요. 다시 조회해 주세요."
              actionLabel="다시 시도"
              onAction={retry}
            />
          ) : null}

          <View style={[styles.hero, { backgroundColor: roleAccent }]}>
            <View style={styles.heroTopRow}>
              <StatusChip label={roleTitle} tone={isParent ? 'parent' : 'child'} />
              <Pressable
                style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
                onPress={() => router.push('/settings' as Href)}
                accessibilityRole="button"
                accessibilityLabel="설정 열기"
              >
                <Ionicons name="settings-outline" size={21} color={colors.onPrimary} />
              </Pressable>
            </View>

            <View style={styles.heroIdentityRow}>
              <View style={styles.heroCopy}>
                <Text style={styles.heroEyebrow}>모험가 길드에 오신 걸 환영해요</Text>
                <Text style={styles.heroTitle} numberOfLines={2}>{profile.nickname}님</Text>
                <Text style={styles.heroDescription}>{heroCopy}</Text>
              </View>
              <View style={styles.heroEmblem} accessibilityElementsHidden>
                <View style={styles.heroEmblemInner}>
                  <Ionicons
                    name={isParent ? 'storefront-outline' : 'shield-half-outline'}
                    size={38}
                    color={colors.accentGold}
                  />
                </View>
              </View>
            </View>

            <View style={styles.heroBalanceRow}>
              <Text style={styles.heroBalanceLabel}>보유 금화</Text>
              <CoinBadge amount={balance.total} />
            </View>
          </View>

          <ParchmentCard style={styles.dailyCard}>
            <View style={[styles.dailyIcon, { backgroundColor: roleSoft }]}>
              <Ionicons name="sunny-outline" size={22} color={roleAccent} />
            </View>
            <View style={styles.dailyCopy}>
              <Text style={styles.dailyLabel}>오늘의 길드 한마디</Text>
              <Text style={styles.dailyMessage}>{dailyMessage}</Text>
            </View>
          </ParchmentCard>

          <View style={styles.section}>
            <SectionHeader title="주요 장소" subtitle="마을에서 향할 곳을 골라보세요." />
            <View style={styles.locationList}>
              <LocationCard
                icon="document-text-outline"
                eyebrow="용병술집"
                title="의뢰 게시판"
                description={isParent ? '새 의뢰를 맡기고 완료 보고를 관리해요.' : '새 의뢰를 확인하고 모험을 시작해요.'}
                accent={colors.primary}
                iconBackground={colors.primarySoft}
                onPress={() => router.push('/quests')}
              />
              <LocationCard
                icon="storefront-outline"
                eyebrow="마을 상점"
                title="보상 상점"
                description={isParent ? '아이에게 제공할 경험과 보상을 관리해요.' : '모은 금화로 받고 싶은 보상을 골라요.'}
                accent={colors.parent}
                iconBackground={colors.parentSoft}
                onPress={() => router.push('/shop')}
              />
              {isParent ? (
                <LocationCard
                  icon="library-outline"
                  eyebrow="금화 보관소"
                  title="마을 은행"
                  description="금화를 충전하고 은행 장부를 확인해요."
                  accent={colors.bank}
                  iconBackground={colors.bankSoft}
                  onPress={() => router.push('/bank')}
                />
              ) : null}
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader title="오늘 확인할 내용" subtitle="지금 처리할 수 있는 의뢰만 모았어요." />
            <FantasyCard style={[styles.questSummary, { borderTopColor: roleAccent }]} raised>
              <View style={[styles.questCountBadge, { backgroundColor: roleSoft }]}>
                <Text style={[styles.questCount, { color: roleAccent }]}>{actionableQuestCount}</Text>
                <Text style={[styles.questCountUnit, { color: roleAccent }]}>건</Text>
              </View>
              <Text style={styles.questSummaryTitle}>{isParent ? '도착한 완료 보고' : '오늘의 모험 후보'}</Text>
              <Text style={styles.questSummaryDescription}>{taskCopy}</Text>
              <PrimaryButton
                label={isParent ? '의뢰 관리하기' : '의뢰 확인하기'}
                onPress={() => router.push('/quests')}
                leading={<Ionicons name="document-text-outline" size={18} color={colors.onPrimary} />}
                style={[styles.questButton, { backgroundColor: roleAccent }]}
              />
            </FantasyCard>
          </View>

          <View style={styles.section}>
            <SectionHeader title="우리 길드" subtitle="현재 연결된 가족 정보예요." />
            <FantasyCard style={styles.familyCard}>
              <View style={[styles.familyIcon, { backgroundColor: roleSoft }]}>
                <Ionicons name="people-outline" size={23} color={roleAccent} />
              </View>
              <View style={styles.familyCopy}>
                <Text style={styles.familyLabel}>{connection?.label ?? '가족 연결'}</Text>
                <Text style={styles.familyName}>{connection?.name ?? '연결 정보를 확인해 주세요'}</Text>
              </View>
              <StatusChip label={connection ? '연결됨' : '확인 필요'} tone={connection ? 'success' : 'warning'} />
            </FantasyCard>
          </View>

          <View style={styles.section}>
            <SectionHeader title="금화 장부" subtitle="재화 구성과 거래 기록을 확인해요." />
            <ParchmentCard style={styles.ledgerCard}>
              <View style={styles.ledgerHeader}>
                <View style={styles.ledgerCopy}>
                  <Text style={styles.ledgerLabel}>현재 보유 재화</Text>
                  <Text style={styles.ledgerCaption}>{isParent ? '의뢰에 사용할 수 있는 전체 재화' : '모험으로 모은 전체 재화'}</Text>
                </View>
                <CoinBadge amount={balance.total} compact />
              </View>
              <View style={styles.ledgerParts}>
                <View style={styles.ledgerPart}>
                  <Text style={styles.ledgerPartLabel}>출석 · ATTENDANCE</Text>
                  <Text style={styles.ledgerPartAmount}>{balance.attendance.toLocaleString()}</Text>
                </View>
                <View style={styles.ledgerDivider} />
                <View style={styles.ledgerPart}>
                  <Text style={styles.ledgerPartLabel}>구매 · CASH</Text>
                  <Text style={styles.ledgerPartAmount}>{balance.cash.toLocaleString()}</Text>
                </View>
              </View>
              <SecondaryButton
                label="거래 장부 열기"
                onPress={() => router.push('/balance' as Href)}
                leading={<Ionicons name="book-outline" size={18} color={colors.primary} />}
                style={styles.ledgerButton}
              />
            </ParchmentCard>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  content: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    gap: spacing.xl,
  },
  hero: {
    padding: spacing.lg,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.accentGold,
    overflow: 'hidden',
    ...shadows.raised,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  settingsButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 253, 247, 0.45)',
  },
  pressed: { opacity: 0.78 },
  heroIdentityRow: { marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroCopy: { flex: 1 },
  heroEyebrow: { ...typography.caption, color: colors.onPrimary, opacity: 0.82 },
  heroTitle: { ...typography.screenTitle, marginTop: spacing.xxs, color: colors.onPrimary },
  heroDescription: { ...typography.body, marginTop: spacing.xs, color: colors.onPrimary, opacity: 0.9 },
  heroEmblem: {
    width: 86,
    height: 98,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255, 253, 247, 0.35)',
  },
  heroEmblemInner: {
    width: 62,
    height: 72,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accentGold,
  },
  heroBalanceRow: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 253, 247, 0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  heroBalanceLabel: { ...typography.button, color: colors.onPrimary },
  dailyCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dailyIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyCopy: { flex: 1 },
  dailyLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '700' },
  dailyMessage: { ...typography.body, marginTop: spacing.xxs, color: colors.textPrimary, fontWeight: '600' },
  section: { gap: spacing.sm },
  locationList: { gap: spacing.sm },
  locationPressable: { borderRadius: radius.xl },
  locationCard: {
    minHeight: 104,
    padding: spacing.md,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  locationIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationCopy: { flex: 1 },
  locationEyebrow: { ...typography.caption, fontWeight: '800' },
  locationTitle: { ...typography.cardTitle, marginTop: 1, color: colors.textPrimary },
  locationDescription: { ...typography.caption, marginTop: spacing.xxs, color: colors.textSecondary },
  questSummary: {
    alignItems: 'center',
    borderTopWidth: 4,
    backgroundColor: colors.surface,
  },
  questCountBadge: {
    minWidth: 78,
    height: 60,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  questCount: { ...typography.coin, fontSize: 30, lineHeight: 36 },
  questCountUnit: { ...typography.caption, fontWeight: '800' },
  questSummaryTitle: { ...typography.cardTitle, marginTop: spacing.sm, color: colors.textPrimary },
  questSummaryDescription: { ...typography.body, marginTop: spacing.xxs, color: colors.textSecondary, textAlign: 'center' },
  questButton: { alignSelf: 'stretch', marginTop: spacing.md },
  familyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  familyIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyCopy: { flex: 1 },
  familyLabel: { ...typography.caption, color: colors.textSecondary },
  familyName: { ...typography.cardTitle, marginTop: 2, color: colors.textPrimary },
  ledgerCard: { gap: spacing.md },
  ledgerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  ledgerCopy: { flex: 1 },
  ledgerLabel: { ...typography.cardTitle, color: colors.textPrimary },
  ledgerCaption: { ...typography.caption, marginTop: spacing.xxs, color: colors.textSecondary },
  ledgerParts: {
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  ledgerPart: { flex: 1, paddingHorizontal: spacing.xs },
  ledgerPartLabel: { color: colors.textSecondary, fontSize: 10, lineHeight: 15, fontWeight: '700' },
  ledgerPartAmount: { ...typography.coin, marginTop: spacing.xxs, color: colors.textPrimary, fontSize: 19, lineHeight: 25 },
  ledgerDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  ledgerButton: { alignSelf: 'stretch', backgroundColor: colors.surface },
})
