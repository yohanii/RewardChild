import type { ShopPurchase } from '@/src/hooks/useShopScreen'
import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

export function ShopPurchaseCard({
  purchase,
  itemTitle,
  childName,
  isParent,
  mutating,
  onFulfill,
}: {
  purchase: ShopPurchase
  itemTitle?: string
  childName?: string
  isParent: boolean
  mutating: boolean
  onFulfill?: () => void
}) {
  const fulfilled = purchase.status === 'FULFILLED'
  const statusLabel = fulfilled
    ? '제공 완료'
    : isParent
      ? '이행 대기'
      : '부모님 확인 대기'

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.title} numberOfLines={1}>
            {itemTitle ?? `상품 #${purchase.shop_item_id}`}
          </Text>
          <Text style={styles.meta}>
            {isParent ? `${childName ?? '알 수 없는 자녀'} · ` : ''}
            {purchase.price_paid.toLocaleString()} COIN
          </Text>
        </View>
        <View style={[styles.statusBadge, fulfilled ? styles.fulfilledBadge : styles.pendingBadge]}>
          <Text style={[styles.statusText, fulfilled ? styles.fulfilledText : styles.pendingText]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      {isParent && !fulfilled ? (
        <Pressable style={styles.fulfillButton} onPress={onFulfill} disabled={mutating}>
          <Text style={styles.fulfillButtonText}>제공 완료</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.035,
    shadowRadius: 10,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleGroup: { flex: 1 },
  title: { color: '#1E293B', fontSize: 15, fontWeight: '700' },
  meta: { color: '#64748B', fontSize: 12, marginTop: 5 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  pendingBadge: { backgroundColor: '#FFF7ED' },
  fulfilledBadge: { backgroundColor: '#ECFDF5' },
  statusText: { fontSize: 11, fontWeight: '800' },
  pendingText: { color: '#C2410C' },
  fulfilledText: { color: '#047857' },
  fulfillButton: {
    alignSelf: 'flex-end',
    marginTop: 13,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 11,
    backgroundColor: '#2563EB',
  },
  fulfillButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
})
