// src/components/quests/QuestDetailModal.tsx
import React from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { Quest, UserRole } from '@/src/types/quest'
import { QuestStatusChip } from './QuestStatusChip'

type Props = {
  visible: boolean
  quest: Quest | null
  role: UserRole
  mutating?: boolean
  ddayLabel: string
  onClose: () => void
  onDelete?: () => void
  onApprove?: () => void
  onReject?: () => void
  onRequest?: () => void
}

export const QuestDetailModal: React.FC<Props> = ({
  visible,
  quest,
  role,
  mutating,
  ddayLabel,
  onClose,
  onDelete,
  onApprove,
  onReject,
  onRequest,
}) => {
  if (!quest) return null

  const isParent = role === 'PARENT'
  const isChild = role === 'CHILD'

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{quest.title}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.statusRow}>
            <QuestStatusChip status={quest.status} />
            <View style={styles.rewardBox}>
              <Text style={styles.rewardLabel}>보상</Text>
              <Text style={styles.rewardValue}>{quest.reward.toLocaleString()} COIN</Text>
            </View>
            <View style={styles.ddayBox}>
              <Text style={styles.ddayText}>{ddayLabel}</Text>
            </View>
          </View>

          <ScrollView style={styles.body}>
            <Text style={styles.sectionTitle}>퀘스트 내용</Text>
            <Text style={styles.contentText}>{quest.content || '상세 설명이 없습니다.'}</Text>
          </ScrollView>

          <View style={styles.footer}>
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
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  content: {
    maxHeight: '80%',
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  closeText: {
    color: '#64748B',
    fontSize: 18,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  rewardBox: {
    flexDirection: 'column',
    marginLeft: 'auto',
  },
  rewardLabel: {
    color: '#94A3B8',
    fontSize: 11,
  },
  rewardValue: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  ddayBox: {
    marginLeft: 8,
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
  body: {
    marginTop: 4,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  contentText: {
    color: '#1E293B',
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
