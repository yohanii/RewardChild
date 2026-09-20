import { Ionicons } from '@expo/vector-icons'
import type { ComponentProps, ReactNode } from 'react'
import React from 'react'
import {
  ActivityIndicator,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native'
import {
  colors,
  layout,
  radius,
  shadows,
  spacing,
  type RoleTone,
  type StatusTone,
  typography,
} from '@/src/theme/tokens'

type ButtonProps = {
  label: string
  onPress?: () => void
  disabled?: boolean
  loading?: boolean
  leading?: ReactNode
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  accessibilityLabel?: string
}

function ButtonContent({
  label,
  loading,
  leading,
  color,
  textStyle,
}: Pick<ButtonProps, 'label' | 'loading' | 'leading' | 'textStyle'> & { color: string }) {
  return (
    <>
      {loading ? <ActivityIndicator size="small" color={color} /> : leading}
      <Text style={[styles.buttonText, { color }, textStyle]}>{label}</Text>
    </>
  )
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  leading,
  style,
  textStyle,
  accessibilityLabel,
}: ButtonProps) {
  const inactive = disabled || loading

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles.primaryButton,
        inactive && styles.buttonDisabled,
        pressed && styles.buttonPressed,
        style,
      ]}
    >
      <ButtonContent label={label} loading={loading} leading={leading} color={colors.onPrimary} textStyle={textStyle} />
    </Pressable>
  )
}

export function SecondaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  leading,
  style,
  textStyle,
  accessibilityLabel,
}: ButtonProps) {
  const inactive = disabled || loading

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles.secondaryButton,
        inactive && styles.buttonDisabled,
        pressed && styles.buttonPressed,
        style,
      ]}
    >
      <ButtonContent label={label} loading={loading} leading={leading} color={colors.primary} textStyle={textStyle} />
    </Pressable>
  )
}

export function FantasyCard({ children, style, raised = false }: { children: ReactNode; style?: StyleProp<ViewStyle>; raised?: boolean }) {
  return <View style={[styles.fantasyCard, raised ? shadows.raised : shadows.card, style]}>{children}</View>
}

export function ParchmentCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.parchmentCard, style]}>{children}</View>
}

type ChipTone = StatusTone | RoleTone

const chipColors: Record<ChipTone, { background: string; foreground: string }> = {
  neutral: { background: colors.surface, foreground: colors.textSecondary },
  info: { background: colors.childSoft, foreground: colors.child },
  success: { background: colors.successSoft, foreground: colors.success },
  warning: { background: colors.warningSoft, foreground: colors.warning },
  danger: { background: colors.dangerSoft, foreground: colors.danger },
  child: { background: colors.childSoft, foreground: colors.child },
  parent: { background: colors.parentSoft, foreground: colors.parent },
  bank: { background: colors.bankSoft, foreground: colors.bank },
}

export function StatusChip({ label, tone = 'neutral', style }: { label: string; tone?: ChipTone; style?: StyleProp<ViewStyle> }) {
  const palette = chipColors[tone]
  return (
    <View style={[styles.chip, { backgroundColor: palette.background }, style]}>
      <Text style={[styles.chipText, { color: palette.foreground }]}>{label}</Text>
    </View>
  )
}

export function CoinBadge({ amount, unit = 'COIN', compact = false }: { amount: number; unit?: string; compact?: boolean }) {
  return (
    <View style={[styles.coinBadge, compact && styles.coinBadgeCompact]} accessibilityLabel={`${amount.toLocaleString()} ${unit}`}>
      <Ionicons name="sparkles" size={compact ? 13 : 15} color={colors.onGold} />
      <Text style={[styles.coinAmount, compact && styles.coinAmountCompact]}>{amount.toLocaleString()}</Text>
      <Text style={styles.coinUnit}>{unit}</Text>
    </View>
  )
}

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={spacing.xs}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

export type FantasyIconName = ComponentProps<typeof Ionicons>['name']

const styles = StyleSheet.create({
  button: {
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  primaryButton: { backgroundColor: colors.primary },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonDisabled: { opacity: 0.48 },
  buttonPressed: { opacity: 0.84 },
  buttonText: typography.button,
  fantasyCard: {
    padding: layout.cardPadding,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  parchmentCard: {
    padding: layout.cardPadding,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.parchment,
  },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipText: { ...typography.caption, fontWeight: '700' },
  coinBadge: {
    alignSelf: 'flex-start',
    minHeight: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.accentGold,
  },
  coinBadgeCompact: { minHeight: 30, paddingHorizontal: spacing.xs },
  coinAmount: { color: colors.onGold, fontSize: 16, lineHeight: 21, fontWeight: '800', fontVariant: ['tabular-nums'] },
  coinAmountCompact: { fontSize: 14 },
  coinUnit: { color: colors.onGold, fontSize: 10, lineHeight: 15, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md },
  sectionCopy: { flex: 1 },
  sectionTitle: { ...typography.sectionTitle, color: colors.textPrimary },
  sectionSubtitle: { ...typography.caption, marginTop: spacing.xxs, color: colors.textSecondary },
  sectionAction: { ...typography.button, color: colors.primary },
})
