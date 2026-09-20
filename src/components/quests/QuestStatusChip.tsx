// src/components/quests/QuestStatusChip.tsx
import React from 'react'
import { StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native'
import type { Quest, QuestStatus } from '@/src/types/quest'
import { getQuestStatusLabel } from '@/src/utils/questDisplay'

type Props = {
  status: Quest['status']
  style?: ViewStyle
  textStyle?: TextStyle
}

const getStatusStyle = (status: QuestStatus | null) => {
  switch (status) {
    case 'REGISTERED':
      return {
        label: getQuestStatusLabel(status),
        container: styles.statusRegistered,
        text: styles.statusRegisteredText,
      }
    case 'REQUESTED':
      return {
        label: getQuestStatusLabel(status),
        container: styles.statusRequested,
        text: styles.statusRequestedText,
      }
    case 'COMPLETED':
      return {
        label: getQuestStatusLabel(status),
        container: styles.statusCompleted,
        text: styles.statusCompletedText,
      }
    case 'REJECTED':
      return {
        label: getQuestStatusLabel(status),
        container: styles.statusRejected,
        text: styles.statusRejectedText,
      }
    default:
      return {
        label: getQuestStatusLabel(status),
        container: styles.statusRegistered,
        text: styles.statusRegisteredText,
      }
  }
}

export const QuestStatusChip: React.FC<Props> = ({ status, style, textStyle }) => {
  const s = getStatusStyle(status)

  return (
    <View style={[styles.statusChip, s.container, style]}>
      <Text style={[styles.statusChipText, s.text, textStyle]}>{s.label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  statusChip: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusRegistered: {
    backgroundColor: '#F1F5F9',
  },
  statusRegisteredText: {
    color: '#475569',
  },
  statusRequested: {
    backgroundColor: '#FFF7ED',
  },
  statusRequestedText: {
    color: '#C2410C',
  },
  statusCompleted: {
    backgroundColor: '#ECFDF5',
  },
  statusCompletedText: {
    color: '#047857',
  },
  statusRejected: {
    backgroundColor: '#FEF2F2',
  },
  statusRejectedText: {
    color: '#B91C1C',
  },
})
