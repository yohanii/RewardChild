import {
  CoinBadge,
  ParchmentCard,
  PrimaryButton,
  SecondaryButton,
} from '@/src/components/common/FantasyPrimitives'
import { colors, layout, radius, shadows, spacing, typography } from '@/src/theme/tokens'
import type { Quest, UserRole } from '@/src/types/quest'
import { getQuestDateLabel, getQuestStatusDescription } from '@/src/utils/questDisplay'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { QuestStatusChip } from './QuestStatusChip'

type Props = {
  visible: boolean
  quest: Quest | null
  role: UserRole
  mutating?: boolean
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
        <ParchmentCard style={styles.content}>
          <View style={styles.pinRow} accessibilityElementsHidden>
            <View style={styles.pin} />
            <Text style={styles.documentLabel}>QUEST NOTICE</Text>
            <View style={styles.pin} />
          </View>

          <View style={styles.headerRow}>
            <View style={styles.titleCopy}>
              <Text style={styles.eyebrow}>길드 의뢰서 상세</Text>
              <Text style={styles.title}>{quest.title}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="의뢰 상세 닫기"
              onPress={onClose}
              hitSlop={spacing.xs}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.metaRow}>
            <QuestStatusChip status={quest.status} />
            <CoinBadge amount={quest.reward} compact />
          </View>

          <View style={styles.noticeBox}>
            <Ionicons name="information-circle-outline" size={19} color={colors.primary} />
            <Text style={styles.statusDescription}>{getQuestStatusDescription(quest.status, role)}</Text>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.dateText}>{getQuestDateLabel(quest)}</Text>
            </View>
            <Text style={styles.sectionTitle}>의뢰 내용</Text>
            <View style={styles.descriptionBox}>
              <Text style={styles.contentText}>{quest.content || '상세 설명이 없는 의뢰예요.'}</Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {isParent && quest.status === 'REQUESTED' && onReject ? (
              <SecondaryButton
                label="보완 요청"
                onPress={onReject}
                disabled={mutating}
                style={[styles.footerButton, styles.rejectButton]}
                textStyle={styles.rejectButtonText}
              />
            ) : null}
            {isParent && quest.status === 'REQUESTED' && onApprove ? (
              <PrimaryButton
                label="완료 승인"
                onPress={onApprove}
                disabled={mutating}
                leading={<Ionicons name="checkmark-circle-outline" size={17} color={colors.onPrimary} />}
                style={[styles.footerButton, styles.approveButton]}
              />
            ) : null}
            {isParent && quest.status === 'REGISTERED' && onDelete ? (
              <SecondaryButton
                label="의뢰 삭제"
                onPress={onDelete}
                disabled={mutating}
                style={[styles.footerButton, styles.deleteButton]}
                textStyle={styles.deleteButtonText}
              />
            ) : null}
            {isChild && (quest.status === 'REGISTERED' || quest.status === 'REJECTED') && onRequest ? (
              <PrimaryButton
                label={quest.status === 'REJECTED' ? '다시 완료 보고' : '완료 보고'}
                onPress={onRequest}
                disabled={mutating}
                leading={<Ionicons name="paper-plane-outline" size={17} color={colors.onPrimary} />}
                style={[styles.footerButton, styles.requestButton]}
              />
            ) : null}
          </View>
        </ParchmentCard>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingVertical: spacing['2xl'],
  },
  content: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '86%',
    alignSelf: 'center',
    padding: spacing.lg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.xl,
    borderBottomRightRadius: radius.lg,
    borderBottomLeftRadius: radius.xl,
    ...shadows.raised,
  },
  pinRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  pin: { width: 9, height: 9, borderRadius: radius.pill, backgroundColor: colors.wood, borderWidth: 2, borderColor: colors.accentGold },
  documentLabel: { color: colors.textSecondary, fontSize: 9, lineHeight: 12, fontWeight: '800', letterSpacing: 1.4 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  titleCopy: { flex: 1 },
  eyebrow: { ...typography.caption, color: colors.primary, fontWeight: '800' },
  title: { ...typography.sectionTitle, marginTop: spacing.xxs, color: colors.textPrimary },
  closeButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.72 },
  metaRow: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  noticeBox: { marginTop: spacing.sm, padding: spacing.sm, borderRadius: radius.md, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, backgroundColor: colors.goldSoft },
  statusDescription: { ...typography.caption, flex: 1, color: colors.textPrimary },
  body: { marginTop: spacing.sm, marginBottom: spacing.md },
  bodyContent: { paddingBottom: spacing.xs },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  dateText: { ...typography.caption, color: colors.textSecondary },
  sectionTitle: { ...typography.cardTitle, marginTop: spacing.md, marginBottom: spacing.xs, color: colors.textPrimary },
  descriptionBox: { minHeight: 94, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  contentText: { ...typography.body, color: colors.textPrimary },
  footer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: spacing.xs },
  footerButton: { flex: 1, minWidth: 120 },
  approveButton: { backgroundColor: colors.success },
  rejectButton: { borderColor: colors.warning, backgroundColor: colors.warningSoft },
  rejectButtonText: { color: colors.warning },
  deleteButton: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  deleteButtonText: { color: colors.danger },
  requestButton: { backgroundColor: colors.child },
})
