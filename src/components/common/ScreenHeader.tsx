import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, radius, spacing, typography } from '@/src/theme/tokens'

type Props = {
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
}

export function ScreenHeader({ title, subtitle, actionLabel, onAction }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
          onPress={onAction}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
  },
  title: {
    ...typography.screenTitle,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    marginTop: spacing.xxs,
    color: colors.textSecondary,
  },
  action: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  actionPressed: { opacity: 0.84 },
  actionText: {
    ...typography.button,
    color: colors.onPrimary,
  },
})
