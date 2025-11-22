// src/components/quests/QuestStatusChip.tsx
import React from 'react'
import { StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native'
import type { QuestStatus } from '@/src/types/quest'

type Props = {
  status: QuestStatus
  style?: ViewStyle
  textStyle?: TextStyle
}

const getStatusStyle = (status: QuestStatus) => {
  switch (status) {
    case 'REGISTERED':
      return {
        label: '등록됨',
        container: styles.statusRegistered,
        text: styles.statusRegisteredText,
      }
    case 'REQUESTED':
      return {
        label: '승인 대기',
        container: styles.statusRequested,
        text: styles.statusRequestedText,
      }
    case 'COMPLETED':
      return {
        label: '완료',
        container: styles.statusCompleted,
        text: styles.statusCompletedText,
      }
    default:
      return {
        label: status,
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
    backgroundColor: '#0B1120',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  statusRegisteredText: {
    color: '#E5E7EB',
  },
  statusRequested: {
    backgroundColor: '#1F2933',
    borderWidth: 1,
    borderColor: '#F97316',
  },
  statusRequestedText: {
    color: '#FED7AA',
  },
  statusCompleted: {
    backgroundColor: '#022C22',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  statusCompletedText: {
    color: '#BBF7D0',
  },
})
