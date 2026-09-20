import {
  CoinBadge,
  ParchmentCard,
  PrimaryButton,
  StatusChip,
} from '@/src/components/common/FantasyPrimitives'
import type { ShopPurchase } from '@/src/hooks/useShopScreen'
import { colors, radius, shadows, spacing, typography } from '@/src/theme/tokens'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

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
  const statusLabel = fulfilled ? '제공 완료' : '제공 대기'
  const statusDescription = fulfilled
    ? '가족이 현실 보상을 전달한 주문이에요.'
    : isParent
      ? '자녀에게 실제 보상을 전달한 뒤 완료 처리해 주세요.'
      : '부모님이 현실 보상을 준비하고 있어요.'

  return (
    <ParchmentCard style={[styles.card, fulfilled && styles.cardFulfilled]}>
      <View style={styles.receiptTop} accessibilityElementsHidden>
        <View style={styles.receiptLine} />
        <Text style={styles.receiptLabel}>REWARD ORDER</Text>
        <View style={styles.receiptLine} />
      </View>

      <View style={styles.headerRow}>
        <View style={[styles.emblem, fulfilled && styles.emblemFulfilled]}>
          <Ionicons name={fulfilled ? 'checkmark-done-outline' : 'receipt-outline'} size={23} color={fulfilled ? colors.success : colors.warning} />
        </View>
        <View style={styles.titleGroup}>
          <Text style={styles.eyebrow}>{isParent ? `${childName ?? '알 수 없는 자녀'}의 주문` : '내 보상 주문'}</Text>
          <Text style={styles.title} numberOfLines={2}>{itemTitle ?? `보상 #${purchase.shop_item_id}`}</Text>
        </View>
        <StatusChip label={statusLabel} tone={fulfilled ? 'success' : 'warning'} />
      </View>

      <View style={styles.orderMeta}>
        <View style={styles.orderCopy}>
          <Text style={styles.orderLabel}>사용한 금화</Text>
          <Text style={styles.orderDescription}>{statusDescription}</Text>
        </View>
        <CoinBadge amount={purchase.price_paid} compact />
      </View>

      {isParent && !fulfilled ? (
        <PrimaryButton
          label="보상 전달 완료"
          onPress={onFulfill}
          disabled={mutating}
          leading={<Ionicons name="checkmark-circle-outline" size={18} color={colors.onPrimary} />}
          style={styles.fulfillButton}
        />
      ) : null}
    </ParchmentCard>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.lg,
    borderBottomRightRadius: radius.md,
    borderBottomLeftRadius: radius.lg,
    backgroundColor: colors.parchment,
    ...shadows.card,
  },
  cardFulfilled: { backgroundColor: colors.surface },
  receiptTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  receiptLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  receiptLabel: { color: colors.textSecondary, fontSize: 9, lineHeight: 12, fontWeight: '800', letterSpacing: 1.2 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  emblem: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emblemFulfilled: { backgroundColor: colors.successSoft },
  titleGroup: { flex: 1 },
  eyebrow: { ...typography.caption, color: colors.textSecondary, fontSize: 10, lineHeight: 14 },
  title: { ...typography.cardTitle, marginTop: 1, color: colors.textPrimary },
  orderMeta: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  orderCopy: { flex: 1 },
  orderLabel: { ...typography.caption, color: colors.textPrimary, fontWeight: '800' },
  orderDescription: { ...typography.caption, marginTop: 2, color: colors.textSecondary },
  fulfillButton: { marginTop: spacing.md, backgroundColor: colors.success },
})
