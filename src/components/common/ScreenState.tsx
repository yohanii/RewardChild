import { Ionicons } from '@expo/vector-icons'
import type { ComponentProps } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'

type IconName = ComponentProps<typeof Ionicons>['name']

export function ScreenLoading({ label = '불러오는 중...' }: { label?: string }) {
  return (
    <View style={styles.loadingContainer} accessibilityRole="progressbar">
      <ActivityIndicator color="#2563EB" />
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
          <Ionicons name={icon} size={24} color="#2563EB" />
        </View>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
        {actionLabel && onAction ? (
          <Pressable style={styles.action} onPress={onAction} accessibilityRole="button">
            <Text style={styles.actionText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#F6F7FB' },
  loadingText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  stateOuter: { width: '100%' },
  stateOuterFull: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#F6F7FB' },
  card: { padding: 22, borderRadius: 20, alignItems: 'center', backgroundColor: '#FFFFFF' },
  iconWrap: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF' },
  title: { marginTop: 12, color: '#1E293B', fontSize: 16, fontWeight: '800', textAlign: 'center' },
  description: { marginTop: 6, color: '#64748B', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  action: { marginTop: 15, minHeight: 42, paddingHorizontal: 18, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563EB' },
  actionText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
})
