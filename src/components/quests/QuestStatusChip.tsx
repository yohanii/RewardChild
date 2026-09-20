// src/components/quests/QuestStatusChip.tsx
import React from 'react'
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native'
import type { Quest, QuestStatus } from '@/src/types/quest'
import { getQuestStatusLabel } from '@/src/utils/questDisplay'
import { colors, radius, spacing, typography } from '@/src/theme/tokens'

type Props = {
  status: Quest['status']
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

const getStatusStyle = (status: QuestStatus | null) => {
  switch (status) {
    case 'REGISTERED':
      return {
        label: getQuestStatusLabel(status),
        container: styles.statusRegistered,
        text: styles.statusRegisteredText,
        dotColor: colors.primary,
      }
    case 'REQUESTED':
      return {
        label: getQuestStatusLabel(status),
        container: styles.statusRequested,
        text: styles.statusRequestedText,
        dotColor: colors.child,
      }
    case 'COMPLETED':
      return {
        label: getQuestStatusLabel(status),
        container: styles.statusCompleted,
        text: styles.statusCompletedText,
        dotColor: colors.success,
      }
    case 'REJECTED':
      return {
        label: getQuestStatusLabel(status),
        container: styles.statusRejected,
        text: styles.statusRejectedText,
        dotColor: colors.warning,
      }
    default:
      return {
        label: getQuestStatusLabel(status),
        container: styles.statusRegistered,
        text: styles.statusRegisteredText,
        dotColor: colors.primary,
      }
  }
}

export const QuestStatusChip: React.FC<Props> = ({ status, style, textStyle }) => {
  const s = getStatusStyle(status)

  return (
    <View style={[styles.statusChip, s.container, style]}>
      <View style={[styles.sealDot, { backgroundColor: s.dotColor }]} />
      <Text style={[styles.statusChipText, s.text, textStyle]}>{s.label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  statusChip: {
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sealDot: { width: 7, height: 7, borderRadius: radius.pill, backgroundColor: colors.textSecondary },
  statusChipText: { ...typography.caption, fontSize: 11, lineHeight: 16, fontWeight: '800' },
  statusRegistered: {
    backgroundColor: colors.goldSoft,
  },
  statusRegisteredText: {
    color: colors.primary,
  },
  statusRequested: {
    backgroundColor: colors.childSoft,
  },
  statusRequestedText: {
    color: colors.child,
  },
  statusCompleted: {
    backgroundColor: colors.successSoft,
  },
  statusCompletedText: {
    color: colors.success,
  },
  statusRejected: {
    backgroundColor: colors.warningSoft,
  },
  statusRejectedText: {
    color: colors.warning,
  },
})
