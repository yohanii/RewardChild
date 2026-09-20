import { CoinBadge, ParchmentCard, SecondaryButton, SectionHeader, StatusChip } from '@/src/components/common/FantasyPrimitives'
import { ScreenLoading, StateCard } from '@/src/components/common/ScreenState'
import { useHomeScreen } from '@/src/hooks/useHomeScreen'
import { colors, layout, radius, shadows, spacing, typography } from '@/src/theme/tokens'
import { Ionicons } from '@expo/vector-icons'
import { router, type Href } from 'expo-router'
import React from 'react'
import { Image, type ImageSourcePropType, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const CHILD_CHARACTER = require('../../../assets/ui/characters/child_hero.png')
const PARENT_CHARACTER = require('../../../assets/ui/characters/parent_merchant.png')
const QUEST_BOARD = require('../../../assets/ui/decorations/quest_board.png')
const SHOP_COUNTER = require('../../../assets/ui/decorations/shop_counter.png')
const BANK_COUNTER = require('../../../assets/ui/decorations/bank_counter.png')
const QUEST_SCROLL = require('../../../assets/ui/decorations/quest_scroll.png')

type LocationCardProps = {
  image: ImageSourcePropType
  title: string
  description: string
  onPress: () => void
}

function LocationCard({ image, title, description, onPress }: LocationCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}로 이동`}
      onPress={onPress}
      style={({ pressed }) => [styles.locationCard, pressed && styles.pressed]}
    >
      <View style={styles.locationImageStage}>
        <Image source={image} style={styles.locationImage} resizeMode="contain" />
      </View>
      <Text style={styles.locationTitle}>{title}</Text>
      <Text style={styles.locationDescription} numberOfLines={3}>{description}</Text>
    </Pressable>
  )
}

export default function HomeScreen() {
  const { profile, balance, connection, actionableQuestCount, loading, refreshing, error, refresh, retry } = useHomeScreen()

  if (loading && !profile) return <ScreenLoading label="길드 소식을 불러오는 중..." />
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
  const character = isParent ? PARENT_CHARACTER : CHILD_CHARACTER
  const roleAccent = isParent ? colors.parent : colors.child
  const roleSoft = isParent ? colors.parentSoft : colors.childSoft
  const roleDescription = isParent ? '길드를 돌보는 상인' : '오늘을 모험하는 용사'
  const dailyMessage = isParent ? '작은 관심이 아이의 큰 변화를 만들어요.' : '작은 도전이 더 멋진 나를 만들어요.'
  const questTitle = isParent ? '완료 보고 확인' : '오늘의 도전 확인'
  const questDescription = actionableQuestCount > 0
    ? isParent
      ? `${actionableQuestCount}건의 완료 보고를 확인해 주세요.`
      : `${actionableQuestCount}건의 모험이 기다리고 있어요.`
    : isParent
      ? '지금 확인할 완료 보고가 없어요.'
      : '지금 바로 확인할 퀘스트가 없어요.'
  const bannerCopy = isParent
    ? '꼼꼼한 준비가 아이의 멋진 내일을 만들어요.'
    : '오늘의 작은 도전이 더 큰 모험을 만들어요.'

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={roleAccent} colors={[roleAccent]} />}
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

          <View style={styles.profileBar}>
            <View style={[styles.portraitFrame, { borderColor: roleAccent, backgroundColor: roleSoft }]}>
              <Image
                source={character}
                style={styles.portraitImage}
                resizeMode="contain"
                accessibilityLabel={isParent ? '검은 고양이 상인 프로필' : '리트리버 용사 프로필'}
              />
            </View>
            <View style={styles.profileCopy}>
              <Text style={styles.nickname} numberOfLines={1}>{profile.nickname}</Text>
              <Text style={styles.roleDescription} numberOfLines={1}>{roleDescription}</Text>
            </View>
            <CoinBadge amount={balance.total} compact />
            <Pressable
              style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
              onPress={() => router.push('/settings' as Href)}
              accessibilityRole="button"
              accessibilityLabel="설정 열기"
              hitSlop={spacing.xxs}
            >
              <Ionicons name="settings-outline" size={21} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ParchmentCard style={styles.dailyCard}>
            <View style={styles.dailyHeading}>
              <Ionicons name="paw" size={17} color={roleAccent} />
              <Text style={styles.dailyLabel}>오늘의 한마디</Text>
            </View>
            <Text style={styles.dailyMessage}>“{dailyMessage}”</Text>
            <View style={styles.parchmentMark} accessibilityElementsHidden>
              <Ionicons name="compass-outline" size={62} color={colors.primary} />
            </View>
          </ParchmentCard>

          <View style={styles.section}>
            <SectionHeader title="주요 장소" subtitle="오늘 향할 곳을 골라보세요." />
            <View style={styles.locationRow}>
              <LocationCard
                image={QUEST_BOARD}
                title="Quest"
                description={isParent ? '의뢰·완료 관리' : '새로운 도전 확인'}
                onPress={() => router.push('/quests')}
              />
              <LocationCard
                image={SHOP_COUNTER}
                title="Shop"
                description={isParent ? '보상 관리' : '모은 금화로 보상 선택'}
                onPress={() => router.push('/shop')}
              />
              {isParent ? (
                <LocationCard image={BANK_COUNTER} title="Bank" description="충전·장부 확인" onPress={() => router.push('/bank')} />
              ) : null}
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader title="오늘의 퀘스트" actionLabel="전체보기" onAction={() => router.push('/quests')} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="오늘의 퀘스트 전체보기"
              onPress={() => router.push('/quests')}
              style={({ pressed }) => [styles.questCard, pressed && styles.pressed]}
            >
              <View style={[styles.questImageStage, { backgroundColor: roleSoft }]}>
                <Image source={QUEST_SCROLL} style={styles.questImage} resizeMode="contain" />
              </View>
              <View style={styles.questCopy}>
                <View style={styles.questTitleRow}>
                  <Text style={styles.questTitle} numberOfLines={1}>{questTitle}</Text>
                  <View style={[styles.countBadge, { backgroundColor: roleAccent }]}>
                    <Text style={styles.countText}>{actionableQuestCount}건</Text>
                  </View>
                </View>
                <Text style={styles.questDescription} numberOfLines={2}>{questDescription}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </Pressable>
          </View>

          <View style={[styles.worldBanner, { borderColor: roleAccent }]}>
            <View style={styles.bannerGlow} accessibilityElementsHidden />
            <View style={styles.bannerCopy}>
              <Text style={styles.bannerEyebrow}>{isParent ? 'MERCHANT GUILD' : 'ADVENTURE AWAITS'}</Text>
              <Text style={styles.bannerMessage}>{bannerCopy}</Text>
            </View>
            <Image source={character} style={styles.bannerCharacter} resizeMode="contain" />
          </View>

          <View style={styles.secondarySection}>
            <SectionHeader title="길드 정보" subtitle="가족 연결과 재화 상세 정보예요." />
            <View style={styles.familyCard}>
              <View style={[styles.secondaryIcon, { backgroundColor: roleSoft }]}>
                <Ionicons name="people-outline" size={22} color={roleAccent} />
              </View>
              <View style={styles.familyCopy}>
                <Text style={styles.secondaryLabel}>{connection?.label ?? '가족 연결'}</Text>
                <Text style={styles.familyName} numberOfLines={2}>{connection?.name ?? '연결 정보를 확인해 주세요'}</Text>
              </View>
              <StatusChip label={connection ? '연결됨' : '확인 필요'} tone={connection ? 'success' : 'warning'} />
            </View>

            <ParchmentCard style={styles.ledgerCard}>
              <View style={styles.ledgerHeader}>
                <View>
                  <Text style={styles.ledgerTitle}>보유 금화 상세</Text>
                  <Text style={styles.secondaryLabel}>재화 구성과 거래 기록</Text>
                </View>
                <CoinBadge amount={balance.total} compact />
              </View>
              <View style={styles.ledgerParts}>
                <View style={styles.ledgerPart}>
                  <Text style={styles.ledgerPartLabel}>ATTENDANCE</Text>
                  <Text style={styles.ledgerPartAmount}>{balance.attendance.toLocaleString()}</Text>
                </View>
                <View style={styles.ledgerDivider} />
                <View style={styles.ledgerPart}>
                  <Text style={styles.ledgerPartLabel}>CASH</Text>
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
  scrollContent: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing['3xl'] },
  content: { width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center', gap: spacing.md },
  pressed: { opacity: 0.8, transform: [{ scale: 0.985 }] },
  profileBar: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  portraitFrame: { width: 54, height: 54, borderRadius: 27, borderWidth: 2, overflow: 'hidden' },
  portraitImage: { position: 'absolute', width: 88, height: 106, left: -18, top: -8 },
  profileCopy: { flex: 1, minWidth: 0 },
  nickname: { ...typography.cardTitle, color: colors.textPrimary },
  roleDescription: { ...typography.caption, color: colors.textSecondary },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  dailyCard: { minHeight: 98, paddingVertical: spacing.md, overflow: 'hidden', justifyContent: 'center', ...shadows.card },
  dailyHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dailyLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '800' },
  dailyMessage: { maxWidth: '84%', marginTop: spacing.xs, color: colors.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '800' },
  parchmentMark: { position: 'absolute', right: 12, top: 17, opacity: 0.1 },
  section: { gap: spacing.xs },
  locationRow: { flexDirection: 'row', gap: spacing.xs },
  locationCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 132,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.accentGold,
    backgroundColor: colors.wood,
    ...shadows.card,
  },
  locationImageStage: { width: 54, height: 48, alignItems: 'center', justifyContent: 'center' },
  locationImage: { width: 54, height: 54 },
  locationTitle: { marginTop: spacing.xxs, color: colors.onPrimary, fontSize: 17, lineHeight: 21, fontWeight: '800' },
  locationDescription: { marginTop: spacing.xxs, color: '#EAD9C2', fontSize: 10, lineHeight: 14, fontWeight: '600', textAlign: 'center' },
  questCard: {
    minHeight: 82,
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.card,
  },
  questImageStage: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  questImage: { width: 47, height: 47 },
  questCopy: { flex: 1, minWidth: 0 },
  questTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  questTitle: { ...typography.cardTitle, flex: 1, color: colors.textPrimary },
  questDescription: { ...typography.caption, marginTop: 2, color: colors.textSecondary },
  countBadge: { paddingHorizontal: spacing.xs, paddingVertical: 3, borderRadius: radius.pill },
  countText: { color: colors.onPrimary, fontSize: 11, lineHeight: 15, fontWeight: '800' },
  worldBanner: {
    height: 126,
    borderRadius: radius.xl,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: colors.wood,
    position: 'relative',
    justifyContent: 'center',
    ...shadows.raised,
  },
  bannerGlow: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    right: -36,
    top: -54,
    backgroundColor: 'rgba(199, 144, 47, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 238, 184, 0.2)',
  },
  bannerCopy: { width: '62%', paddingLeft: spacing.md, zIndex: 1 },
  bannerEyebrow: { color: colors.accentGold, fontSize: 10, lineHeight: 14, fontWeight: '900', letterSpacing: 1.2 },
  bannerMessage: { marginTop: spacing.xs, color: colors.onPrimary, fontSize: 16, lineHeight: 23, fontWeight: '800' },
  bannerCharacter: { position: 'absolute', width: 140, height: 168, right: -5, bottom: -54 },
  secondarySection: { gap: spacing.sm, marginTop: spacing.xs },
  familyCard: {
    minHeight: 76,
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.card,
  },
  secondaryIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  familyCopy: { flex: 1, minWidth: 0 },
  secondaryLabel: { ...typography.caption, color: colors.textSecondary },
  familyName: { ...typography.cardTitle, marginTop: 1, color: colors.textPrimary },
  ledgerCard: { gap: spacing.sm },
  ledgerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  ledgerTitle: { ...typography.cardTitle, color: colors.textPrimary },
  ledgerParts: { paddingVertical: spacing.xs, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border, flexDirection: 'row' },
  ledgerPart: { flex: 1, paddingHorizontal: spacing.xs },
  ledgerPartLabel: { color: colors.textSecondary, fontSize: 10, lineHeight: 14, fontWeight: '700' },
  ledgerPartAmount: { color: colors.textPrimary, fontSize: 18, lineHeight: 24, fontWeight: '800' },
  ledgerDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  ledgerButton: { alignSelf: 'stretch', backgroundColor: colors.surface },
})
