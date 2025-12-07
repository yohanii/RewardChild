// app/quests/index.tsx
import { QuestCard } from '@/src/components/quests/QuestCard'
import { QuestCreateModal } from '@/src/components/quests/QuestCreateModal'
import { QuestDetailModal } from '@/src/components/quests/QuestDetailModal'
import { useQuestsScreen } from '@/src/hooks/useQuestsScreen'
import { router } from 'expo-router'
import React, { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'

export default function QuestsScreen() {
  const {
    profile,
    balance,
    quests,
    loading,
    mutating,
    selectedQuest,
    modalVisible,
    openQuest,
    closeQuest,
    deleteQuest,
    childRequestQuest,
    parentApproveQuest,
    getDDayLabel,
    createQuest,
  } = useQuestsScreen()

  const [createVisible, setCreateVisible] = useState(false)

  if (loading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    )
  }

  const renderEmptyState = () => {
    if (!profile) return null
    if (profile.role === 'PARENT') {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>아직 등록된 퀘스트가 없어요.</Text>
          <Text style={styles.emptySubtitle}>상단 버튼으로 첫 번째 퀘스트를 만들어볼까요?</Text>
        </View>
      )
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>아직 받을 수 있는 퀘스트가 없어요.</Text>
        <Text style={styles.emptySubtitle}>부모님께 새로운 퀘스트를 부탁해보세요!</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* 상단: 잔액 + 부모 전용 등록 버튼 */}
      <View style={styles.header}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>내 재화</Text>
          <Text style={styles.balanceValue}>{balance.toLocaleString()} COIN</Text>
        </View>

        {profile?.role === 'PARENT' && (
            <Pressable
                style={styles.createQuestButton}
                onPress={() => setCreateVisible(true)}
            >
                <Text style={styles.createQuestButtonText}>퀘스트 등록</Text>
            </Pressable>
        )}
      </View>

      <View style={styles.navRow}>
        <Pressable
          style={styles.navButton}
          onPress={() => router.push('/shop')}
        >
          <Text style={styles.navButtonText}>상점</Text>
        </Pressable>
        {profile?.role === 'PARENT' && (
          <Pressable
            style={styles.navButton}
            onPress={() => router.push('/bank')}
          >
            <Text style={styles.navButtonText}>은행</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>오늘의 퀘스트</Text>

        {loading ? (
          <View style={styles.loadingInlineContainer}>
            <ActivityIndicator />
          </View>
        ) : quests.length === 0 ? (
          renderEmptyState()
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {quests.map((q) => (
              <QuestCard
                key={q.id}
                quest={q}
                role={profile!.role}
                mutating={mutating}
                ddayLabel={getDDayLabel(q)}
                onPress={() => openQuest(q)}
                onDelete={() => deleteQuest(q)}
                onApprove={() => parentApproveQuest(q)}
                onRequest={() => childRequestQuest(q)}
              />
            ))}
          </ScrollView>
        )}
      </View>

      <QuestDetailModal
        visible={modalVisible}
        quest={selectedQuest}
        role={profile?.role ?? 'CHILD'}
        mutating={mutating}
        ddayLabel={selectedQuest ? getDDayLabel(selectedQuest) : 'D-1'}
        onClose={closeQuest}
        onDelete={selectedQuest ? () => deleteQuest(selectedQuest) : undefined}
        onApprove={selectedQuest ? () => parentApproveQuest(selectedQuest) : undefined}
        onRequest={selectedQuest ? () => childRequestQuest(selectedQuest) : undefined}
      />

      <QuestCreateModal
        visible={createVisible}
        mutating={mutating}
        onClose={() => setCreateVisible(false)}
        onSubmit={createQuest}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 16,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  balanceCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  balanceLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  balanceValue: {
    color: '#F9FAFB',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  createQuestButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createQuestButtonText: {
    color: '#022C22',
    fontSize: 14,
    fontWeight: '700',
  },
  navRow: {
    position: 'absolute',
    top: 12,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 20,
  },
  navButton: {
    width: 72,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    color: '#E0E7FF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
    marginTop: 8,
  },
  sectionTitle: {
    color: '#E5E7EB',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  loadingInlineContainer: {
    marginTop: 24,
  },
  emptyContainer: {
    marginTop: 32,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  emptyTitle: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  scrollContent: {
    paddingVertical: 8,
    paddingBottom: 24,
    gap: 12,
  },
})
