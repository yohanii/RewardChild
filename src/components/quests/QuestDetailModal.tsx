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
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.85)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  content: {
    maxHeight: '80%',
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  closeText: {
    color: '#9CA3AF',
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
    color: '#9CA3AF',
    fontSize: 11,
  },
  rewardValue: {
    color: '#FACC15',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  ddayBox: {
    marginLeft: 8,
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
  body: {
    marginTop: 4,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  contentText: {
    color: '#E5E7EB',
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
