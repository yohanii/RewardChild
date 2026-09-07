// src/components/quests/QuestCard.tsx
import type { Quest, UserRole } from '@/src/types/quest'
import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { QuestStatusChip } from './QuestStatusChip'

type Props = {
  quest: Quest
  role: UserRole
  mutating?: boolean
  onPress: () => void
  onDelete?: () => void
  onApprove?: () => void
  onReject?: () => void
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
  onReject,
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
            {quest.status === 'REQUESTED' && onReject && (
              <Pressable
                style={[styles.actionButton, styles.rejectButton]}
                onPress={onReject}
                disabled={mutating}
              >
                <Text style={styles.actionButtonText}>반려</Text>
              </Pressable>
            )}
            {quest.status === 'REGISTERED' && onDelete && (
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

        {isChild &&
          (quest.status === 'REGISTERED' || quest.status === 'REJECTED') &&
          onRequest && (
          <Pressable
            style={[styles.actionButton, styles.requestButton]}
            onPress={onRequest}
            disabled={mutating}
          >
            <Text style={styles.actionButtonText}>
              {quest.status === 'REJECTED' ? '다시 완료 요청' : '완료 요청'}
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 17,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    color: '#1E293B',
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
    color: '#94A3B8',
    fontSize: 11,
  },
  rewardValue: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  ddayBox: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
  },
  ddayText: {
    color: '#475569',
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
  rejectButton: {
    backgroundColor: '#F97316',
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
