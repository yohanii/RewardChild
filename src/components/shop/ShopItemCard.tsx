// src/components/shop/ShopItemCard.tsx
import type { ShopItem } from '@/src/hooks/useShopScreen';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function ShopItemCard({
  item,
  purchased,
  isParent,
  mutating,
  onEdit,
  onDeactivate,
}: {
  item: ShopItem
  purchased: boolean
  isParent: boolean
  mutating: boolean
  onEdit?: () => void
  onDeactivate?: () => void
}) {
  return (
    <View style={[styles.card, purchased && styles.cardPurchased]}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.price}>{item.price.toLocaleString()} COIN</Text>
      </View>

      {!!item.content && (
        <Text style={styles.content} numberOfLines={2}>
          {item.content}
        </Text>
      )}

      <View style={styles.footerRow}>
        <View style={[styles.badge, item.is_active ? styles.badgeAvailable : styles.badgePurchased]}>
          <Text style={styles.badgeText}>
            {isParent ? (item.is_active ? '판매 중' : '비활성') : purchased ? '구매함' : '미구매'}
          </Text>
        </View>
        {isParent ? (
          <View style={styles.actions}>
            <Pressable style={styles.editButton} onPress={onEdit} disabled={mutating}>
              <Text style={styles.editButtonText}>수정</Text>
            </Pressable>
            {item.is_active ? (
              <Pressable style={styles.deactivateButton} onPress={onDeactivate} disabled={mutating}>
                <Text style={styles.deactivateButtonText}>비활성화</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 17,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
  },
  cardPurchased: {
    opacity: 0.75,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  price: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
  footerRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  badgeAvailable: {
    backgroundColor: '#EFF6FF',
  },
  badgePurchased: {
    backgroundColor: '#F1F5F9',
  },
  badgeText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  actions: { flexDirection: 'row', gap: 8 },
  editButton: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#EFF6FF' },
  editButtonText: { color: '#1D4ED8', fontSize: 12, fontWeight: '700' },
  deactivateButton: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#FEF2F2' },
  deactivateButtonText: { color: '#B91C1C', fontSize: 12, fontWeight: '700' },
})
