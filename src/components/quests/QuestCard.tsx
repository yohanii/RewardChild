// src/components/quests/QuestCard.tsx
import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { Quest, UserRole } from '@/src/types/quest'
import { QuestStatusChip } from './QuestStatusChip'

type Props = {
  quest: Quest
  role: UserRole
  mutating?: boolean
  onPress: () => void
  onDelete?: () => void
  onApprove?: () => void
  onRequest?: () => void
  ddayLabel: string
}

export const QuestCard: React.FC<Props> = ({
  quest,
  role,
  mutating,
  onPress,
  onDelete,
  onApprove,
  onRequest,
  ddayLabel,
}) => {
  const isParent = role === 'PARENT'
  const isChild = role === 'CHILD'

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          {quest.title}
        </Text>
        <QuestStatusChip status={quest.status} />
      </View>

      <View style={styles.metaRow}>
        <View style={styles.rewardBox}>
          <Text style={styles.rewardLabel}>보상</Text>
          <Text style={styles.rewardValue}>{quest.reward.toLocaleString()} COIN</Text>
        </View>
        <View style={styles.ddayBox}>
          <Text style={styles.ddayText}>{ddayLabel}</Text>
        </View>
      </View>

      {/* 역할별 버튼 */}
      <View style={styles.actionsRow}>
        {isParent && (
          <>
            {quest.status === 'REQUESTED' && onApprove && (
              <Pressable
                style={[styles.actionButton, styles.approveButton]}
                onPress={onApprove}
                disabled={mutating}
              >
                <Text style={styles.actionButtonText}>승인</Text>
              </Pressable>
            )}
            {onDelete && (
              <Pressable
                style={[styles.actionButton, styles.deleteButton]}
                onPress={onDelete}
                disabled={mutating}
              >
                <Text style={styles.actionButtonText}>삭제</Text>
              </Pressable>
            )}
          </>
        )}

        {isChild && quest.status === 'REGISTERED' && onRequest && (
          <Pressable
            style={[styles.actionButton, styles.requestButton]}
            onPress={onRequest}
            disabled={mutating}
          >
            <Text style={styles.actionButtonText}>완료 요청</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  rewardBox: {
    flexDirection: 'column',
  },
  rewardLabel: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  rewardValue: {
    color: '#FACC15',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  ddayBox: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#4B5563',
    backgroundColor: '#020617',
  },
  ddayText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
    gap: 8,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  approveButton: {
    backgroundColor: '#22C55E',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  requestButton: {
    backgroundColor: '#3B82F6',
  },
  actionButtonText: {
    color: '#F9FAFB',
    fontSize: 12,
    fontWeight: '600',
  },
})
