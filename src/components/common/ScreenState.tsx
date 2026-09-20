import { Ionicons } from '@expo/vector-icons'
import type { ComponentProps } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { PrimaryButton } from './FantasyPrimitives'
import { colors, layout, radius, spacing, typography } from '@/src/theme/tokens'

type IconName = ComponentProps<typeof Ionicons>['name']

export function ScreenLoading({ label = '불러오는 중...' }: { label?: string }) {
  return (
    <View style={styles.loadingContainer} accessibilityRole="progressbar">
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  )
}

export function StateCard({
  title,
  description,
  icon = 'information-circle-outline',
  actionLabel,
  onAction,
  fullScreen = false,
}: {
  title: string
  description?: string
  icon?: IconName
  actionLabel?: string
  onAction?: () => void
  fullScreen?: boolean
}) {
  return (
    <View style={[styles.stateOuter, fullScreen && styles.stateOuterFull]}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={24} color={colors.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
        {actionLabel && onAction ? (
          <PrimaryButton label={actionLabel} onPress={onAction} style={styles.action} />
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.background },
  loadingText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  stateOuter: { width: '100%' },
  stateOuterFull: { flex: 1, padding: layout.screenHorizontalPadding, justifyContent: 'center', backgroundColor: colors.background },
  card: { padding: spacing.xl, borderRadius: radius.xl, alignItems: 'center', backgroundColor: colors.surfaceRaised, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  iconWrap: { width: 46, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  title: { ...typography.cardTitle, marginTop: spacing.sm, color: colors.textPrimary, fontWeight: '800', textAlign: 'center' },
  description: { ...typography.body, marginTop: spacing.xs, color: colors.textSecondary, textAlign: 'center' },
  action: { marginTop: spacing.md, paddingHorizontal: layout.cardPadding },
})
