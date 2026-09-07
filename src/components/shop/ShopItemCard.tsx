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
})
