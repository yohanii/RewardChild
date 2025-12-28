// src/components/shop/ShopItemCard.tsx
import type { ShopItem } from '@/src/hooks/useShopScreen';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function ShopItemCard({ item, purchased }: { item: ShopItem; purchased: boolean }) {
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
        <View style={[styles.badge, purchased ? styles.badgePurchased : styles.badgeAvailable]}>
          <Text style={styles.badgeText}>{purchased ? '구매함' : '미구매'}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
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
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  price: {
    color: '#E0E7FF',
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    color: '#9CA3AF',
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
    borderWidth: 1,
  },
  badgeAvailable: {
    backgroundColor: '#0B1220',
    borderColor: '#1F2937',
  },
  badgePurchased: {
    backgroundColor: '#0B1220',
    borderColor: '#374151',
  },
  badgeText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '700',
  },
})