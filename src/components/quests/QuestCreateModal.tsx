import {
  ParchmentCard,
  PrimaryButton,
  SecondaryButton,
} from '@/src/components/common/FantasyPrimitives'
import { colors, layout, radius, shadows, spacing, typography } from '@/src/theme/tokens'
import { showAlert } from '@/src/utils/alert'
import { Ionicons } from '@expo/vector-icons'
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
      content: trimmedContent.length > 0 ? trimmedContent : undefined,
    })

    if (ok) onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ParchmentCard style={styles.content}>
          <View style={styles.pinRow} accessibilityElementsHidden>
            <View style={styles.pin} />
            <Text style={styles.documentLabel}>NEW QUEST NOTICE</Text>
            <View style={styles.pin} />
          </View>

          <View style={styles.headerRow}>
            <View style={styles.titleCopy}>
              <Text style={styles.eyebrow}>용병술집 게시판</Text>
              <Text style={styles.title}>새 의뢰서 작성</Text>
              <Text style={styles.subtitle}>용사가 이해하기 쉽도록 할 일과 보상을 적어주세요.</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="새 의뢰 등록 닫기"
              onPress={onClose}
              hitSlop={spacing.xs}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.field}>
              <Text style={styles.label}>의뢰 제목 <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="예: 오늘 숙제 30분 하기"
                placeholderTextColor={colors.disabled}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>의뢰 내용 (선택)</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="완료 조건이나 응원의 말을 적어주세요."
                placeholderTextColor={colors.disabled}
                multiline
                value={content}
                onChangeText={setContent}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>보상 금화 <Text style={styles.required}>*</Text></Text>
              <View style={styles.rewardInputRow}>
                <Ionicons name="sparkles" size={19} color={colors.accentGold} />
                <TextInput
                  style={styles.rewardInput}
                  placeholder="예: 100"
                  placeholderTextColor={colors.disabled}
                  keyboardType="number-pad"
                  value={rewardText}
                  onChangeText={setRewardText}
                />
                <Text style={styles.rewardUnit}>COIN</Text>
              </View>
              <Text style={styles.helperText}>1 이상의 숫자를 입력해 주세요.</Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <SecondaryButton label="취소" onPress={onClose} disabled={mutating} style={styles.footerButton} />
            <PrimaryButton
              label={mutating ? '게시 중...' : '의뢰서 게시'}
              onPress={handleSubmit}
              disabled={mutating}
              loading={mutating}
              leading={<Ionicons name="pin-outline" size={18} color={colors.onPrimary} />}
              style={[styles.footerButton, styles.submitButton]}
            />
          </View>
        </ParchmentCard>
      </KeyboardAvoidingView>
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
    maxHeight: '90%',
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
  eyebrow: { ...typography.caption, color: colors.parent, fontWeight: '800' },
  title: { ...typography.sectionTitle, marginTop: spacing.xxs, color: colors.textPrimary },
  subtitle: { ...typography.caption, marginTop: spacing.xxs, color: colors.textSecondary },
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
  body: { marginTop: spacing.md, marginBottom: spacing.sm },
  bodyContent: { gap: spacing.md, paddingBottom: spacing.xs },
  field: { gap: spacing.xs },
  label: { ...typography.caption, color: colors.textPrimary, fontWeight: '800' },
  required: { color: colors.danger },
  input: {
    minHeight: layout.minTouchTarget,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    ...typography.body,
  },
  textarea: { minHeight: 104, textAlignVertical: 'top' },
  rewardInputRow: {
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
  },
  rewardInput: { flex: 1, paddingVertical: spacing.xs, color: colors.textPrimary, ...typography.body },
  rewardUnit: { color: colors.onGold, fontSize: 10, lineHeight: 15, fontWeight: '800' },
  helperText: { ...typography.caption, color: colors.textSecondary },
  footer: { flexDirection: 'row', gap: spacing.xs },
  footerButton: { flex: 1 },
  submitButton: { backgroundColor: colors.parent },
})
