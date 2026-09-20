import {
  CoinBadge,
  ParchmentCard,
  PrimaryButton,
  SecondaryButton,
  StatusChip,
} from '@/src/components/common/FantasyPrimitives'
import type { ShopItem } from '@/src/hooks/useShopScreen'
import { colors, radius, shadows, spacing, typography } from '@/src/theme/tokens'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

export function ShopItemCard({
  item,
  purchased,
  isParent,
  mutating,
  onEdit,
  onDeactivate,
  onPurchase,
}: {
  item: ShopItem
  purchased: boolean
  isParent: boolean
  mutating: boolean
  onEdit?: () => void
  onDeactivate?: () => void
  onPurchase?: () => void
}) {
  return (
    <ParchmentCard style={[styles.card, !item.is_active && styles.cardInactive]}>
      <View style={styles.tagNotch} accessibilityElementsHidden />
      <View style={styles.headerRow}>
        <View style={styles.emblem}>
          <Ionicons name="gift-outline" size={24} color={colors.parent} />
        </View>
        <View style={styles.titleCopy}>
          <Text style={styles.eyebrow}>현실에서 받는 가족 보상</Text>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        </View>
      </View>

      <Text style={styles.content} numberOfLines={3}>
        {item.content?.trim() || '가족이 함께 약속한 특별한 경험과 보상이에요.'}
      </Text>

      <View style={styles.priceTag}>
        <View>
          <Text style={styles.priceLabel}>필요 금화</Text>
          <Text style={styles.priceHint}>보상을 요청할 때 사용해요</Text>
        </View>
        <CoinBadge amount={item.price} compact />
      </View>

      <View style={styles.statusRow}>
        <StatusChip
          label={isParent
            ? item.is_active ? '판매 중' : '판매 중지'
            : purchased ? '구매 기록 있음' : '선택 가능'}
          tone={isParent
            ? item.is_active ? 'success' : 'neutral'
            : purchased ? 'info' : 'success'}
        />
        {purchased && !isParent ? <Text style={styles.repeatHint}>다시 받을 수도 있어요</Text> : null}
      </View>

      {isParent ? (
        <View style={styles.actions}>
          <SecondaryButton
            label="보상 수정"
            onPress={onEdit}
            disabled={mutating}
            leading={<Ionicons name="create-outline" size={17} color={colors.primary} />}
            style={styles.actionButton}
          />
          {item.is_active ? (
            <SecondaryButton
              label="판매 중지"
              onPress={onDeactivate}
              disabled={mutating}
              style={[styles.actionButton, styles.deactivateButton]}
              textStyle={styles.deactivateButtonText}
            />
          ) : null}
        </View>
      ) : (
        <PrimaryButton
          label={purchased ? '이 보상 다시 받기' : '이 보상 받기'}
          onPress={onPurchase}
          disabled={mutating || !item.is_active}
          leading={<Ionicons name="bag-handle-outline" size={18} color={colors.onPrimary} />}
          style={styles.purchaseButton}
        />
      )}
    </ParchmentCard>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.md,
    borderBottomRightRadius: radius.lg,
    borderBottomLeftRadius: radius.md,
    backgroundColor: colors.parchment,
    overflow: 'hidden',
    ...shadows.card,
  },
  cardInactive: { backgroundColor: colors.surface, opacity: 0.76 },
  tagNotch: {
    position: 'absolute',
    top: -8,
    right: 22,
    width: 32,
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.wood,
    borderWidth: 2,
    borderColor: colors.accentGold,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  emblem: {
    width: 50,
    height: 50,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.parentSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  titleCopy: { flex: 1 },
  eyebrow: { ...typography.caption, color: colors.parent, fontSize: 10, lineHeight: 14, fontWeight: '800' },
  title: { ...typography.cardTitle, marginTop: 2, color: colors.textPrimary },
  content: { ...typography.body, marginTop: spacing.sm, color: colors.textSecondary },
  priceTag: {
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  priceLabel: { ...typography.caption, color: colors.textPrimary, fontWeight: '800' },
  priceHint: { color: colors.textSecondary, fontSize: 10, lineHeight: 14, marginTop: 1 },
  statusRow: { marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
  repeatHint: { ...typography.caption, flex: 1, color: colors.textSecondary, textAlign: 'right' },
  actions: { marginTop: spacing.md, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  actionButton: { flex: 1, minWidth: 112 },
  deactivateButton: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  deactivateButtonText: { color: colors.danger },
  purchaseButton: { marginTop: spacing.md, backgroundColor: colors.child },
})
