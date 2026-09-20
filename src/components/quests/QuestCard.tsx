import {
  CoinBadge,
  ParchmentCard,
  PrimaryButton,
  SecondaryButton,
} from '@/src/components/common/FantasyPrimitives'
import { colors, radius, shadows, spacing, typography } from '@/src/theme/tokens'
import type { Quest, UserRole } from '@/src/types/quest'
import { getQuestDateLabel, getQuestStatusDescription } from '@/src/utils/questDisplay'
import { Ionicons } from '@expo/vector-icons'
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
}) => {
  const isParent = role === 'PARENT'
  const isChild = role === 'CHILD'
  const isCompleted = quest.status === 'COMPLETED'

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${quest.title} 의뢰 상세 보기`}
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <ParchmentCard style={[styles.card, isCompleted && styles.cardCompleted]}>
        <View style={styles.pinRow} accessibilityElementsHidden>
          <View style={styles.pin} />
          <View style={styles.pin} />
        </View>

        <View style={styles.headerRow}>
          <View style={[styles.emblem, isCompleted && styles.emblemCompleted]}>
            <Ionicons
              name={isCompleted ? 'checkmark-outline' : 'document-text-outline'}
              size={22}
              color={isCompleted ? colors.success : colors.primary}
            />
          </View>
          <View style={styles.titleCopy}>
            <Text style={styles.kicker}>길드 의뢰서</Text>
            <Text style={styles.title} numberOfLines={2}>{quest.title}</Text>
          </View>
          <Ionicons name="chevron-forward" size={19} color={colors.textSecondary} />
        </View>

        <View style={styles.metaRow}>
          <QuestStatusChip status={quest.status} />
          <CoinBadge amount={quest.reward} compact />
        </View>

        <Text style={styles.statusDescription}>{getQuestStatusDescription(quest.status, role)}</Text>

        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.dateText}>{getQuestDateLabel(quest)}</Text>
        </View>

        <View style={styles.actionsRow}>
          {isParent && quest.status === 'REQUESTED' && onApprove ? (
            <PrimaryButton
              label="완료 승인"
              onPress={onApprove}
              disabled={mutating}
              leading={<Ionicons name="checkmark-circle-outline" size={17} color={colors.onPrimary} />}
              style={[styles.actionButton, styles.approveButton]}
            />
          ) : null}
          {isParent && quest.status === 'REQUESTED' && onReject ? (
            <SecondaryButton
              label="보완 요청"
              onPress={onReject}
              disabled={mutating}
              style={[styles.actionButton, styles.rejectButton]}
              textStyle={styles.rejectButtonText}
            />
          ) : null}
          {isParent && quest.status === 'REGISTERED' && onDelete ? (
            <SecondaryButton
              label="의뢰 삭제"
              onPress={onDelete}
              disabled={mutating}
              style={[styles.actionButton, styles.deleteButton]}
              textStyle={styles.deleteButtonText}
            />
          ) : null}
          {isChild && (quest.status === 'REGISTERED' || quest.status === 'REJECTED') && onRequest ? (
            <PrimaryButton
              label={quest.status === 'REJECTED' ? '다시 완료 보고' : '완료 보고'}
              onPress={onRequest}
              disabled={mutating}
              leading={<Ionicons name="paper-plane-outline" size={17} color={colors.onPrimary} />}
              style={[styles.actionButton, styles.requestButton]}
            />
          ) : null}
        </View>
      </ParchmentCard>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pressable: { borderRadius: radius.lg },
  pressed: { opacity: 0.82 },
  card: {
    paddingTop: spacing.sm,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.lg,
    borderBottomRightRadius: radius.md,
    borderBottomLeftRadius: radius.lg,
    backgroundColor: colors.parchment,
    ...shadows.card,
  },
  cardCompleted: { backgroundColor: colors.surface, opacity: 0.9 },
  pinRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.xxs, marginBottom: spacing.xxs },
  pin: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.wood,
    borderWidth: 2,
    borderColor: colors.accentGold,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  emblem: {
    width: 46,
    height: 46,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emblemCompleted: { backgroundColor: colors.successSoft },
  titleCopy: { flex: 1 },
  kicker: { ...typography.caption, color: colors.textSecondary, fontSize: 10, lineHeight: 14, fontWeight: '800' },
  title: { ...typography.cardTitle, marginTop: 1, color: colors.textPrimary },
  metaRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  statusDescription: { ...typography.caption, marginTop: spacing.sm, color: colors.textPrimary },
  dateRow: { marginTop: spacing.xs, flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  dateText: { ...typography.caption, color: colors.textSecondary, fontSize: 11, lineHeight: 16 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: spacing.sm, gap: spacing.xs },
  actionButton: { minHeight: 40, borderRadius: radius.md },
  approveButton: { flex: 1, minWidth: 118, backgroundColor: colors.success },
  rejectButton: { flex: 1, minWidth: 110, borderColor: colors.warning, backgroundColor: colors.warningSoft },
  rejectButtonText: { color: colors.warning },
  deleteButton: { minWidth: 112, borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  deleteButtonText: { color: colors.danger },
  requestButton: { flex: 1, minWidth: 150, backgroundColor: colors.child },
})
