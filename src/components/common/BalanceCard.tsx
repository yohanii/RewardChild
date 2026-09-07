import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

type BalancePart = {
  label: string
  amount: number
}

type Props = {
  label: string
  amount: number
  caption?: string
  parts?: BalancePart[]
  compact?: boolean
}

export function BalanceCard({ label, amount, caption, parts, compact = false }: Props) {
  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.labelRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="wallet-outline" size={18} color="#2563EB" />
        </View>
        <Text style={styles.label}>{label}</Text>
      </View>

      <View style={styles.amountRow}>
        <Text style={[styles.amount, compact && styles.amountCompact]}>
          {amount.toLocaleString()}
        </Text>
        <Text style={styles.unit}>COIN</Text>
      </View>

      {caption ? <Text style={styles.caption}>{caption}</Text> : null}

      {parts && parts.length > 0 ? (
        <View style={styles.partsRow}>
          {parts.map((part) => (
            <View key={part.label} style={styles.part}>
              <Text style={styles.partLabel}>{part.label}</Text>
              <Text style={styles.partAmount}>{part.amount.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 22,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  cardCompact: {
    padding: 18,
    borderRadius: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  label: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 7,
    marginTop: 14,
  },
  amount: {
    color: '#0F172A',
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1,
  },
  amountCompact: {
    fontSize: 30,
  },
  unit: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '800',
  },
  caption: {
    marginTop: 6,
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
  },
  partsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  part: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
  },
  partLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  partAmount: {
    marginTop: 5,
    color: '#1E293B',
    fontSize: 18,
    fontWeight: '800',
  },
})
