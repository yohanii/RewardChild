import { BalanceCard } from '@/src/components/common/BalanceCard'
import {
  getTransactionLabel,
  getTransactionSource,
  type BalanceTransaction,
  useBalanceScreen,
} from '@/src/hooks/useBalanceScreen'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

function formatDate(value: string | null) {
  if (!value) return '시간 정보 없음'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '시간 정보 없음'
  return date.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getDisplayNote(note: string | null) {
  const trimmed = note?.trim()
  if (!trimmed) return null
  if (trimmed === 'Daily attendance top-up') return '일일 출석 보충'
  if (trimmed === 'Spend from ATTENDANCE bucket') return 'ATTENDANCE 사용'
  if (trimmed === 'Spend from CASH bucket') return 'CASH 사용'
  return trimmed
}

function TransactionRow({ transaction }: { transaction: BalanceTransaction }) {
  const positive = transaction.amount >= 0
  const source = getTransactionSource(transaction.reference_type)
  const note = getDisplayNote(transaction.note)

  return (
    <View style={styles.transactionRow}>
      <View style={[styles.transactionIcon, positive ? styles.positiveIcon : styles.negativeIcon]}>
        <Ionicons
          name={positive ? 'arrow-down-outline' : 'arrow-up-outline'}
          size={18}
          color={positive ? '#047857' : '#B45309'}
        />
      </View>
      <View style={styles.transactionCopy}>
        <Text style={styles.transactionTitle}>
          {getTransactionLabel(transaction.type, transaction.reference_type)}
        </Text>
        <Text style={styles.transactionMeta} numberOfLines={1}>
          {[source, note, formatDate(transaction.created_at)].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <Text style={[styles.transactionAmount, positive ? styles.positiveAmount : styles.negativeAmount]}>
        {positive ? '+' : ''}{transaction.amount.toLocaleString()}
      </Text>
    </View>
  )
}

export default function BalanceScreen() {
  const { balance, transactions, loading, refreshing, error, refresh, retry } = useBalanceScreen()

  if (loading && transactions.length === 0 && !error) {
    return <View style={styles.loadingContainer}><ActivityIndicator color="#2563EB" /></View>
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
        >
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </Pressable>
        <Text style={styles.headerTitle}>재화 내역</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#2563EB"
            colors={['#2563EB']}
          />
        )}
      >
        <BalanceCard
          label="총 사용 가능 재화"
          amount={balance.total}
          parts={[
            { label: '출석 · ATTENDANCE', amount: balance.attendance },
            { label: '구매 · CASH', amount: balance.cash },
          ]}
        />

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>{error}</Text>
            <Text style={styles.errorDescription}>네트워크 연결을 확인하고 다시 시도해 주세요.</Text>
            <Pressable style={styles.retryButton} onPress={retry} accessibilityRole="button">
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>최근 거래</Text>
          <Text style={styles.sectionCaption}>최근 50건</Text>
        </View>

        {transactions.length > 0 ? (
          <View style={styles.transactionList}>
            {transactions.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
          </View>
        ) : !loading && !error ? (
          <View style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={28} color="#94A3B8" />
            <Text style={styles.emptyTitle}>아직 거래 내역이 없어요.</Text>
            <Text style={styles.emptyDescription}>재화를 받거나 사용하면 이곳에 기록됩니다.</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F7FB' },
  header: { minHeight: 58, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  headerTitle: { color: '#0F172A', fontSize: 20, fontWeight: '800' },
  headerSpacer: { width: 42 },
  scrollView: { flex: 1 },
  scrollContent: { width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 36, gap: 18 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F7FB' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: '#334155', fontSize: 16, fontWeight: '800' },
  sectionCaption: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  transactionList: { borderRadius: 20, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  transactionRow: { minHeight: 76, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E2E8F0' },
  transactionIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  positiveIcon: { backgroundColor: '#ECFDF5' },
  negativeIcon: { backgroundColor: '#FFF7ED' },
  transactionCopy: { flex: 1 },
  transactionTitle: { color: '#1E293B', fontSize: 14, fontWeight: '700' },
  transactionMeta: { color: '#64748B', fontSize: 11, marginTop: 5 },
  transactionAmount: { fontSize: 15, fontWeight: '800' },
  positiveAmount: { color: '#047857' },
  negativeAmount: { color: '#B45309' },
  errorCard: { padding: 18, borderRadius: 20, alignItems: 'flex-start', backgroundColor: '#FFFFFF' },
  errorTitle: { color: '#B91C1C', fontSize: 15, fontWeight: '800' },
  errorDescription: { color: '#64748B', fontSize: 12, marginTop: 5 },
  retryButton: { marginTop: 12, paddingHorizontal: 15, paddingVertical: 9, borderRadius: 12, backgroundColor: '#2563EB' },
  retryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  emptyCard: { padding: 28, borderRadius: 20, alignItems: 'center', backgroundColor: '#FFFFFF' },
  emptyTitle: { color: '#334155', fontSize: 15, fontWeight: '700', marginTop: 10 },
  emptyDescription: { color: '#94A3B8', fontSize: 12, marginTop: 5 },
})
