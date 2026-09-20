import { BalanceCard } from '@/src/components/common/BalanceCard'
import { ScreenHeader } from '@/src/components/common/ScreenHeader'
import { QuestCard } from '@/src/components/quests/QuestCard'
import { QuestCreateModal } from '@/src/components/quests/QuestCreateModal'
import { QuestDetailModal } from '@/src/components/quests/QuestDetailModal'
import { useQuestsScreen } from '@/src/hooks/useQuestsScreen'
import type { Quest } from '@/src/types/quest'
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
    return <View style={styles.loadingContainer}><ActivityIndicator color="#2563EB" /></View>
  }
  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centeredError}>
          <Text style={styles.errorTitle}>{error ?? '퀘스트 정보를 표시할 수 없어요.'}</Text>
          <Text style={styles.errorSubtitle}>네트워크 연결을 확인하고 다시 시도해 주세요.</Text>
          <Pressable style={styles.retryButton} onPress={retry} accessibilityRole="button">
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  const isParent = profile?.role === 'PARENT'
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
      <View style={styles.content}>
        <ScreenHeader
          title="퀘스트"
          subtitle={isParent ? '아이의 할 일과 완료 요청을 관리해요.' : '오늘 할 일을 확인하고 완료를 요청해요.'}
          actionLabel={isParent && !hasMultipleActiveRelations ? '퀘스트 등록' : undefined}
          onAction={isParent && !hasMultipleActiveRelations ? () => setCreateVisible(true) : undefined}
        />
        <BalanceCard label="사용 가능한 코인" amount={balance} compact />

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          alwaysBounceVertical
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#2563EB" colors={['#2563EB']} />}
        >
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>{error}</Text>
              <Text style={styles.errorSubtitle}>기존 화면은 유지했어요. 다시 조회해 주세요.</Text>
              <Pressable style={styles.retryButton} onPress={retry} accessibilityRole="button">
                <Text style={styles.retryButtonText}>다시 시도</Text>
              </Pressable>
            </View>
          )}
          {hasMultipleActiveRelations ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>가족 선택 기능을 준비 중이에요.</Text>
              <Text style={styles.emptySubtitle}>여러 관계의 퀘스트를 섞어 표시하지 않습니다.</Text>
            </View>
          ) : loading ? (
            <View style={styles.loadingInline}><ActivityIndicator color="#2563EB" /></View>
          ) : (
            <>
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>{isParent ? '진행 중 · 확인 필요' : '진행 중'}</Text>
                <Text style={styles.sectionCount}>{activeQuests.length}</Text>
              </View>

              {activeQuests.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>지금 진행 중인 퀘스트가 없어요.</Text>
                  <Text style={styles.emptySubtitle}>
                    {isParent ? '새 퀘스트를 등록해 보세요.' : '새 퀘스트가 도착하면 이곳에 표시돼요.'}
                  </Text>
                </View>
              ) : activeQuests.map(renderQuest)}

              <View style={[styles.sectionHeading, styles.completedHeading]}>
                <Text style={styles.sectionTitle}>완료됨</Text>
                <Text style={styles.sectionCount}>{completedQuests.length}</Text>
              </View>

              {completedQuests.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>아직 완료된 퀘스트가 없어요.</Text>
                  <Text style={styles.emptySubtitle}>완료된 퀘스트는 진행 목록과 분리해 보여드려요.</Text>
                </View>
              ) : (
                <>
                  <Pressable
                    style={styles.completedToggle}
                    onPress={() => setShowCompleted((current) => !current)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.completedToggleText}>
                      {showCompleted ? '완료 내역 접기' : `완료 내역 ${completedQuests.length}개 보기`}
                    </Text>
                    <Text style={styles.completedToggleIcon}>{showCompleted ? '⌃' : '⌄'}</Text>
                  </Pressable>
                  {showCompleted ? completedQuests.map(renderQuest) : null}
                </>
              )}
            </>
          )}
        </ScrollView>
      </View>

      <QuestDetailModal
        visible={modalVisible}
        quest={selectedQuest}
        role={profile?.role ?? 'CHILD'}
        mutating={mutating}
        onClose={closeQuest}
        onDelete={selectedQuest ? () => deleteQuest(selectedQuest) : undefined}
        onApprove={selectedQuest ? () => parentApproveQuest(selectedQuest) : undefined}
        onReject={selectedQuest ? () => parentRejectQuest(selectedQuest) : undefined}
        onRequest={selectedQuest ? () => childRequestQuest(selectedQuest) : undefined}
      />
      <QuestCreateModal visible={createVisible} mutating={mutating} onClose={() => setCreateVisible(false)} onSubmit={createQuest} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F7FB' },
  content: { flex: 1, width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 16, gap: 18 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F7FB' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  completedHeading: { marginTop: 10 },
  sectionTitle: { color: '#334155', fontSize: 16, fontWeight: '800' },
  sectionCount: { minWidth: 26, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, overflow: 'hidden', textAlign: 'center', color: '#475569', fontSize: 11, fontWeight: '800', backgroundColor: '#E2E8F0' },
  loadingInline: { paddingTop: 24 },
  emptyContainer: { padding: 20, borderRadius: 20, backgroundColor: '#FFFFFF' },
  emptyTitle: { color: '#1E293B', fontSize: 16, fontWeight: '700' },
  emptySubtitle: { color: '#64748B', fontSize: 13, lineHeight: 19, marginTop: 5 },
  centeredError: { flex: 1, margin: 20, padding: 22, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  errorContainer: { padding: 20, borderRadius: 20, alignItems: 'flex-start', backgroundColor: '#FFFFFF' },
  errorTitle: { color: '#1E293B', fontSize: 16, fontWeight: '700' },
  errorSubtitle: { color: '#64748B', fontSize: 13, lineHeight: 19, marginTop: 5 },
  retryButton: { marginTop: 14, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#2563EB' },
  retryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  completedToggle: { minHeight: 52, paddingHorizontal: 17, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF' },
  completedToggleText: { color: '#475569', fontSize: 14, fontWeight: '700' },
  completedToggleIcon: { color: '#64748B', fontSize: 18, fontWeight: '700' },
  list: { flex: 1, marginHorizontal: -2 },
  scrollContent: { paddingHorizontal: 2, paddingBottom: 28, gap: 12 },
})
