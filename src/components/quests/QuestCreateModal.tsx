// src/components/quests/QuestCreateModal.tsx
import { showAlert } from '@/src/utils/alert'
import React, { useEffect, useState } from 'react'
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'

export type QuestCreatePayload = {
  title: string
  content?: string
  reward: number
}

type Props = {
  visible: boolean
  mutating?: boolean
  onClose: () => void
  onSubmit: (payload: QuestCreatePayload) => Promise<boolean>
}

export const QuestCreateModal: React.FC<Props> = ({
  visible,
  mutating,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [rewardText, setRewardText] = useState('')

  // 모달 열릴 때마다 입력값 초기화
  useEffect(() => {
    if (visible) {
      setTitle('')
      setContent('')
      setRewardText('')
    }
  }, [visible])

  const handleSubmit = async () => {
    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()
    const parsedReward = parseInt(rewardText, 10)

    if (!trimmedTitle) {
      showAlert('입력 오류', '제목을 입력해주세요.')
      return
    }

    if (!rewardText) {
      showAlert('입력 오류', '보상 재화를 입력해주세요.')
      return
    }

    if (Number.isNaN(parsedReward) || parsedReward <= 0) {
      showAlert('입력 오류', '보상 재화는 1 이상의 숫자로 입력해주세요.')
      return
    }

    const ok = await onSubmit({
      title: trimmedTitle,
      reward: parsedReward,
      content: trimmedContent.length > 0 ? trimmedContent : undefined, // 선택 입력
    })

    if (ok) {
      onClose()
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          {/* 헤더 */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>새 퀘스트 등록</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            {/* 제목 */}
            <View style={styles.field}>
              <Text style={styles.label}>
                제목 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="예: 오늘 숙제 30분 하기"
                placeholderTextColor="#6B7280"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* 내용 (선택) */}
            <View style={styles.field}>
              <Text style={styles.label}>내용 (선택)</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="퀘스트에 대한 자세한 설명을 적어주세요."
                placeholderTextColor="#6B7280"
                multiline
                value={content}
                onChangeText={setContent}
              />
            </View>

            {/* 재화 */}
            <View style={styles.field}>
              <Text style={styles.label}>
                보상 재화 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="예: 100"
                placeholderTextColor="#6B7280"
                keyboardType="number-pad"
                value={rewardText}
                onChangeText={setRewardText}
              />
              <Text style={styles.helperText}>1 이상 숫자로 입력해주세요.</Text>
            </View>
          </ScrollView>

          {/* 버튼 영역 */}
          <View style={styles.footer}>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.cancelButtonText}>취소</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={mutating}
            >
              <Text style={styles.submitButtonText}>
                {mutating ? '등록 중...' : '등록하기'}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: '85%',
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
  body: {
    marginTop: 4,
    marginBottom: 12,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  required: {
    color: '#F97316',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#F9FAFB',
    fontSize: 14,
    backgroundColor: '#020617',
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    marginTop: 4,
    fontSize: 11,
    color: '#9CA3AF',
  },
  footer: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  cancelButton: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  cancelButtonText: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#22C55E',
  },
  submitButtonText: {
    color: '#022C22',
    fontSize: 13,
    fontWeight: '700',
  },
})
