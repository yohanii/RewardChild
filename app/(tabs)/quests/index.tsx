import {
  CoinBadge,
  PrimaryButton,
  SectionHeader,
  StatusChip,
} from '@/src/components/common/FantasyPrimitives'
import { ScreenLoading, StateCard } from '@/src/components/common/ScreenState'
import { QuestCard } from '@/src/components/quests/QuestCard'
import { QuestCreateModal } from '@/src/components/quests/QuestCreateModal'
import { QuestDetailModal } from '@/src/components/quests/QuestDetailModal'
import { QuestStatusChip } from '@/src/components/quests/QuestStatusChip'
import { useQuestsScreen } from '@/src/hooks/useQuestsScreen'
import { colors, layout, radius, shadows, spacing, typography } from '@/src/theme/tokens'
import type { Quest } from '@/src/types/quest'
import { Ionicons } from '@expo/vector-icons'
import React, { useState } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function QuestsScreen() {
  const {
    profile, balance, activeQuests, completedQuests, loading, refreshing, error, mutating, selectedQuest, modalVisible,
    openQuest, closeQuest, deleteQuest, childRequestQuest, parentApproveQuest,
    parentRejectQuest, createQuest, hasMultipleActiveRelations,
    refresh, retry,
  } = useQuestsScreen()
  const [createVisible, setCreateVisible] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

  if (loading && !profile) {
    return <ScreenLoading label="의뢰 게시판을 살펴보는 중..." />
  }
  if (!profile) {
    return (
      <StateCard
        fullScreen
        icon="cloud-offline-outline"
        title={error ?? '의뢰 게시판을 표시할 수 없어요.'}
        description="네트워크 연결을 확인하고 다시 시도해 주세요."
        actionLabel="다시 시도"
        onAction={retry}
      />
    )
  }

  const isParent = profile.role === 'PARENT'
  const roleAccent = isParent ? colors.parent : colors.child
  const roleSoft = isParent ? colors.parentSoft : colors.childSoft
  const renderQuest = (quest: Quest) => (
    <QuestCard
      key={quest.id}
      quest={quest}
      role={profile.role}
      mutating={mutating}
      onPress={() => openQuest(quest)}
      onDelete={() => deleteQuest(quest)}
      onApprove={() => parentApproveQuest(quest)}
      onReject={() => parentRejectQuest(quest)}
      onRequest={() => childRequestQuest(quest)}
    />
  )

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical
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
          <View style={styles.hero}>
            <View style={styles.heroGlow} accessibilityElementsHidden>
              <Ionicons name="flame-outline" size={52} color={colors.accentGold} />
            </View>
            <View style={styles.heroTopRow}>
              <StatusChip label={isParent ? '길드 상인의 게시판' : '리트리버 용사의 게시판'} tone={isParent ? 'parent' : 'child'} />
              <CoinBadge amount={balance} compact />
            </View>
            <View style={styles.heroTitleRow}>
              <View style={[styles.heroEmblem, { backgroundColor: roleSoft }]}>
                <Ionicons name={isParent ? 'create-outline' : 'shield-half-outline'} size={27} color={roleAccent} />
              </View>
              <View style={styles.heroCopy}>
                <Text style={styles.heroEyebrow}>용병술집 · 의뢰 게시판</Text>
                <Text style={styles.heroTitle}>오늘의 의뢰</Text>
                <Text style={styles.heroDescription}>
                  {isParent ? '오늘의 의뢰를 등록하고 완료 보고를 관리해 보세요.' : '오늘은 어떤 의뢰에 도전할까요? 모험을 골라보세요.'}
                </Text>
              </View>
            </View>
            {isParent && !hasMultipleActiveRelations ? (
              <PrimaryButton
                label="새 의뢰 등록"
                onPress={() => setCreateVisible(true)}
                leading={<Ionicons name="add-circle-outline" size={18} color={colors.onPrimary} />}
                style={styles.createButton}
              />
            ) : null}
          </View>

          <View style={styles.legend}>
            <QuestStatusChip status="REGISTERED" />
            <QuestStatusChip status="REQUESTED" />
            <QuestStatusChip status="REJECTED" />
            <QuestStatusChip status="COMPLETED" />
          </View>

          {error ? (
            <StateCard
              icon="cloud-offline-outline"
              title={error}
              description="기존 의뢰서는 유지했어요. 다시 조회해 주세요."
              actionLabel="다시 시도"
              onAction={retry}
            />
          ) : null}

          {hasMultipleActiveRelations ? (
            <StateCard
              icon="people-outline"
              title="가족 선택 기능을 준비 중이에요."
              description="여러 관계의 의뢰를 섞어 표시하지 않습니다."
            />
          ) : loading ? (
            <View style={styles.loadingInline}><ActivityIndicator color={roleAccent} /></View>
          ) : (
            <>
              <View style={styles.section}>
                <SectionHeader
                  title={isParent ? '진행 중 · 확인 필요' : '진행 중인 의뢰'}
                  subtitle={isParent ? '완료 보고가 도착한 의뢰를 먼저 보여드려요.' : '재도전 가능한 의뢰를 먼저 보여드려요.'}
                />
                <View style={styles.board}>
                  <View style={styles.boardRail} accessibilityElementsHidden>
                    <View style={styles.boardNail} />
                    <Text style={styles.boardLabel}>ACTIVE REQUESTS</Text>
                    <View style={styles.boardNail} />
                  </View>
                  <View style={styles.boardCountRow}>
                    <Text style={styles.boardCountLabel}>게시된 의뢰</Text>
                    <View style={styles.boardCountBadge}>
                      <Text style={styles.boardCount}>{activeQuests.length}</Text>
                    </View>
                  </View>
                  {activeQuests.length === 0 ? (
                    <StateCard
                      icon="checkmark-circle-outline"
                      title="지금 진행 중인 의뢰가 없어요."
                      description={isParent ? '새 의뢰를 게시해 보세요.' : '새 의뢰가 도착하면 이곳에 표시돼요.'}
                    />
                  ) : activeQuests.map(renderQuest)}
                </View>
              </View>

              <View style={styles.section}>
                <SectionHeader title="완료 의뢰 보관함" subtitle="승인과 보상 정산이 끝난 기록이에요." />
                {completedQuests.length === 0 ? (
                  <StateCard
                    icon="archive-outline"
                    title="아직 완료된 의뢰가 없어요."
                    description="완료된 의뢰는 진행 목록과 분리해 보관해요."
                  />
                ) : (
                  <>
                    <Pressable
                      style={({ pressed }) => [styles.completedToggle, pressed && styles.pressed]}
                      onPress={() => setShowCompleted((current) => !current)}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: showCompleted }}
                    >
                      <View style={styles.completedToggleIcon}>
                        <Ionicons name="archive-outline" size={21} color={colors.success} />
                      </View>
                      <View style={styles.completedToggleCopy}>
                        <Text style={styles.completedToggleTitle}>완료된 의뢰 {completedQuests.length}건</Text>
                        <Text style={styles.completedToggleDescription}>{showCompleted ? '보관함을 접으려면 누르세요.' : '지난 의뢰서를 펼쳐보세요.'}</Text>
                      </View>
                      <Ionicons name={showCompleted ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
                    </Pressable>
                    {showCompleted ? <View style={styles.completedList}>{completedQuests.map(renderQuest)}</View> : null}
                  </>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <QuestDetailModal
        visible={modalVisible}
        quest={selectedQuest}
        role={profile.role}
        mutating={mutating}
        onClose={closeQuest}
        onDelete={selectedQuest ? () => deleteQuest(selectedQuest) : undefined}
        onApprove={selectedQuest ? () => parentApproveQuest(selectedQuest) : undefined}
        onReject={selectedQuest ? () => parentRejectQuest(selectedQuest) : undefined}
        onRequest={selectedQuest ? () => childRequestQuest(selectedQuest) : undefined}
      />
      <QuestCreateModal
        visible={createVisible}
        mutating={mutating}
        onClose={() => setCreateVisible(false)}
        onSubmit={createQuest}
      />
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
  content: { width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center', gap: spacing.xl },
  hero: {
    padding: spacing.lg,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.accentGold,
    backgroundColor: colors.wood,
    overflow: 'hidden',
    ...shadows.raised,
  },
  heroGlow: { position: 'absolute', right: -8, bottom: -5, opacity: 0.18 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  heroTitleRow: { marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  heroEmblem: {
    width: 52,
    height: 60,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accentGold,
  },
  heroCopy: { flex: 1 },
  heroEyebrow: { ...typography.caption, color: colors.accentGold, fontWeight: '800' },
  heroTitle: { ...typography.screenTitle, marginTop: 1, color: colors.onPrimary },
  heroDescription: { ...typography.body, marginTop: spacing.xxs, color: colors.onPrimary, opacity: 0.86 },
  createButton: { marginTop: spacing.lg, backgroundColor: colors.parent },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  loadingInline: { paddingVertical: spacing['2xl'] },
  section: { gap: spacing.sm },
  board: {
    padding: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.accentGold,
    backgroundColor: colors.wood,
    gap: spacing.sm,
    ...shadows.raised,
  },
  boardRail: {
    minHeight: 34,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.accentGold,
  },
  boardNail: { width: 7, height: 7, borderRadius: radius.pill, backgroundColor: colors.accentGold },
  boardLabel: { color: colors.onPrimary, fontSize: 10, lineHeight: 14, fontWeight: '800', letterSpacing: 1.2 },
  boardCountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xxs },
  boardCountLabel: { ...typography.caption, color: colors.parchment, fontWeight: '700' },
  boardCountBadge: { minWidth: 28, paddingHorizontal: spacing.xs, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: colors.goldSoft },
  boardCount: { color: colors.onGold, fontSize: 11, lineHeight: 16, fontWeight: '800', textAlign: 'center' },
  completedToggle: {
    minHeight: 74,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  pressed: { opacity: 0.8 },
  completedToggleIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.successSoft },
  completedToggleCopy: { flex: 1 },
  completedToggleTitle: { ...typography.cardTitle, color: colors.textPrimary },
  completedToggleDescription: { ...typography.caption, marginTop: 2, color: colors.textSecondary },
  completedList: { gap: spacing.sm },
})
