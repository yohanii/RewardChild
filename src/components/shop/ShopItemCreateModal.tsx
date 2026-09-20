import {
  ParchmentCard,
  PrimaryButton,
  SecondaryButton,
} from '@/src/components/common/FantasyPrimitives'
import { colors, layout, radius, shadows, spacing, typography } from '@/src/theme/tokens'
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

export function ShopItemCreateModal({
  visible,
  mutating,
  onClose,
  onSubmit,
  initialItem,
}: {
  visible: boolean
  mutating: boolean
  onClose: () => void
  onSubmit: (payload: { title: string; content?: string; price: number }) => Promise<void> | void
  initialItem?: { title: string; content: string | null; price: number }
}) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [price, setPrice] = useState('')

  useEffect(() => {
    if (!visible) return
    setTitle(initialItem?.title ?? '')
    setContent(initialItem?.content ?? '')
    setPrice(initialItem ? String(initialItem.price) : '')
  }, [initialItem, visible])

  const submit = async () => {
    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()
    const parsedPrice = Number(price)

    if (!trimmedTitle) return
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) return

    await onSubmit({ title: trimmedTitle, content: trimmedContent, price: parsedPrice })
  }

  const isEditing = Boolean(initialItem)

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ParchmentCard style={styles.card}>
          <View style={styles.receiptTop} accessibilityElementsHidden>
            <View style={styles.pin} />
            <Text style={styles.documentLabel}>{isEditing ? 'EDIT REWARD TAG' : 'NEW REWARD TAG'}</Text>
            <View style={styles.pin} />
          </View>

          <View style={styles.headerRow}>
            <View style={styles.titleCopy}>
              <Text style={styles.eyebrow}>검은 고양이의 상점 관리</Text>
              <Text style={styles.title}>{isEditing ? '보상 정보 수정' : '새 보상 등록'}</Text>
              <Text style={styles.subtitle}>가족이 현실에서 제공할 경험이나 보상을 적어주세요.</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="보상 등록 닫기"
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
              <Text style={styles.label}>보상 이름</Text>
              <TextInput
                style={styles.input}
                placeholder="예: 주말에 아이스크림 사주기"
                placeholderTextColor={colors.disabled}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>실제 제공 내용</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="예: 주말에 함께 아이스크림을 먹으러 가요."
                placeholderTextColor={colors.disabled}
                value={content}
                onChangeText={setContent}
                multiline
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>필요 금화</Text>
              <View style={styles.priceInputRow}>
                <Ionicons name="sparkles" size={19} color={colors.accentGold} />
                <TextInput
                  style={styles.priceInput}
                  placeholder="예: 100"
                  placeholderTextColor={colors.disabled}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="number-pad"
                />
                <Text style={styles.priceUnit}>COIN</Text>
              </View>
              <Text style={styles.helperText}>자녀가 이 보상을 요청할 때 사용할 금화예요.</Text>
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <SecondaryButton label="취소" onPress={onClose} disabled={mutating} style={styles.actionButton} />
            <PrimaryButton
              label={mutating ? '저장 중...' : isEditing ? '수정 저장' : '보상 등록'}
              onPress={submit}
              disabled={mutating}
              loading={mutating}
              leading={<Ionicons name={isEditing ? 'save-outline' : 'pricetag-outline'} size={18} color={colors.onPrimary} />}
              style={[styles.actionButton, styles.submitButton]}
            />
          </View>
        </ParchmentCard>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingVertical: spacing['2xl'],
  },
  card: {
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
  receiptTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  pin: { width: 9, height: 9, borderRadius: radius.pill, backgroundColor: colors.wood, borderWidth: 2, borderColor: colors.accentGold },
  documentLabel: { color: colors.textSecondary, fontSize: 9, lineHeight: 12, fontWeight: '800', letterSpacing: 1.3 },
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
  input: {
    minHeight: layout.minTouchTarget,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    ...typography.body,
  },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  priceInputRow: {
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
  },
  priceInput: { flex: 1, paddingVertical: spacing.xs, color: colors.textPrimary, ...typography.body },
  priceUnit: { color: colors.onGold, fontSize: 10, lineHeight: 15, fontWeight: '800' },
  helperText: { ...typography.caption, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: spacing.xs },
  actionButton: { flex: 1 },
  submitButton: { backgroundColor: colors.parent },
})
