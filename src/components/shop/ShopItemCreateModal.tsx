// src/components/shop/ShopItemCreateModal.tsx
import React, { useEffect, useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

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
    // 열릴 때 초기화하고 싶으면 아래 유지
    setTitle(initialItem?.title ?? '')
    setContent(initialItem?.content ?? '')
    setPrice(initialItem ? String(initialItem.price) : '')
  }, [initialItem, visible])

  const submit = async () => {
    const t = title.trim()
    const c = content.trim()
    const p = Number(price)

    if (!t) return
    if (!Number.isFinite(p) || p <= 0) return

    await onSubmit({ title: t, content: c, price: p })
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{initialItem ? '아이템 수정' : '아이템 등록'}</Text>

          <Text style={styles.label}>제목</Text>
          <TextInput
            style={styles.input}
            placeholder="예) 주말 아이스크림 1개"
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>내용</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="예) 주말에 아이스크림 1개 먹기"
            placeholderTextColor="#94A3B8"
            value={content}
            onChangeText={setContent}
            multiline
          />

          <Text style={styles.label}>가격 (COIN)</Text>
          <TextInput
            style={styles.input}
            placeholder="예) 10"
            placeholderTextColor="#94A3B8"
            value={price}
            onChangeText={setPrice}
            keyboardType="number-pad"
          />

          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.cancel]} onPress={onClose} disabled={mutating}>
              <Text style={styles.cancelText}>취소</Text>
            </Pressable>

            <Pressable style={[styles.button, styles.submit]} onPress={submit} disabled={mutating}>
              <Text style={styles.submitText}>
                {mutating ? '저장 중...' : initialItem ? '저장' : '등록'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  title: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  label: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: {
    backgroundColor: '#F1F5F9',
  },
  submit: {
    backgroundColor: '#2563EB',
  },
  cancelText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
})
