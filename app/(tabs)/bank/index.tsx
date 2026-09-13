import { BalanceCard } from '@/src/components/common/BalanceCard'
import { ScreenHeader } from '@/src/components/common/ScreenHeader'
import { useBankScreen, type BankFeedback } from '@/src/hooks/useBankScreen'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

function FeedbackBanner({ feedback }: { feedback: BankFeedback }) {
  const isSuccess = feedback.tone === 'success'
  const isError = feedback.tone === 'error'
  return (
    <View style={[
      styles.feedback,
      isSuccess && styles.feedbackSuccess,
      isError && styles.feedbackError,
    ]}>
      <Ionicons
        name={isSuccess ? 'checkmark-circle' : isError ? 'alert-circle' : 'information-circle'}
        size={20}
        color={isSuccess ? '#15803D' : isError ? '#B91C1C' : '#1D4ED8'}
      />
      <Text style={[
        styles.feedbackText,
        isSuccess && styles.feedbackTextSuccess,
        isError && styles.feedbackTextError,
      ]}>
        {feedback.message}
      </Text>
    </View>
  )
}

export default function BankScreen() {
  const {
    balance,
    billingMode,
    connected,
    feedback,
    items,
    loading,
    processingProductId,
    purchases,
    refreshing,
    storeProducts,
    purchaseProduct,
    reconnectBilling,
    recoverPurchases,
    refreshBankData,
  } = useBankScreen()

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator color="#2563EB" /></View>
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl refreshing={refreshing} onRefresh={refreshBankData} tintColor="#2563EB" />
        )}
      >
        <View style={styles.content}>
          <ScreenHeader
            title="Bank"
            subtitle={billingMode === 'mock'
              ? '개발용 서버 경로로 CASH 충전 UX를 테스트해요.'
              : 'Google Play에서 CASH를 안전하게 충전해요.'}
          />

          {billingMode === 'mock' ? (
            <View style={styles.mockBadge}>
              <Ionicons name="flask-outline" size={14} color="#9A3412" />
              <Text style={styles.mockBadgeText}>개발용 Mock 결제</Text>
            </View>
          ) : null}

          <BalanceCard
            label="현재 보유 재화"
            amount={balance.attendance + balance.cash}
            caption="구매한 CASH는 서버에서 결제를 확인한 뒤 반영돼요."
            parts={[
              { label: '출석 · ATTENDANCE', amount: balance.attendance },
              { label: '구매 · CASH', amount: balance.cash },
            ]}
          />

          {feedback ? <FeedbackBanner feedback={feedback} /> : null}

          {billingMode === 'google-play' && Platform.OS !== 'android' ? (
            <View style={styles.noticeCard}>
              <View style={styles.noticeIcon}>
                <Ionicons name="logo-google-playstore" size={22} color="#2563EB" />
              </View>
              <View style={styles.noticeCopy}>
                <Text style={styles.noticeTitle}>Android 전용 기능이에요</Text>
                <Text style={styles.noticeDescription}>실제 구매는 Android development build에서 확인할 수 있어요.</Text>
              </View>
            </View>
          ) : billingMode === 'google-play' && !connected ? (
            <Pressable style={styles.noticeCard} onPress={reconnectBilling}>
              <View style={styles.noticeIcon}><Ionicons name="refresh" size={22} color="#2563EB" /></View>
              <View style={styles.noticeCopy}>
                <Text style={styles.noticeTitle}>Google Play 연결 중</Text>
                <Text style={styles.noticeDescription}>연결이 오래 걸리면 눌러서 다시 시도해 주세요.</Text>
              </View>
            </Pressable>
          ) : null}

          <View style={styles.section}>
            <View>
              <Text style={styles.sectionTitle}>CASH 충전</Text>
              <Text style={styles.sectionSubtitle}>
                {billingMode === 'mock' ? 'DB의 활성 Bank 상품 설정으로 지급해요.' : '가격은 Google Play 기준으로 표시돼요.'}
              </Text>
            </View>

            <View style={styles.productList}>
              {items.map((item) => {
                const productId = item.google_play_product_id
                const storeProduct = productId ? storeProducts.get(productId) : undefined
                const isProcessing = processingProductId === productId
                const disabled = !connected || !storeProduct || Boolean(processingProductId)

                return (
                  <View key={item.id} style={styles.productCard}>
                    <View style={styles.productTopRow}>
                      <View style={styles.cashIcon}><Ionicons name="sparkles" size={22} color="#D97706" /></View>
                      <View style={styles.productCopy}>
                        <Text style={styles.productTitle}>{item.title}</Text>
                        <Text style={styles.cashAmount}>{item.cash_amount.toLocaleString()} CASH</Text>
                      </View>
                      <Text style={styles.localizedPrice}>{storeProduct?.displayPrice ?? '가격 확인 중'}</Text>
                    </View>

                    <Pressable
                      style={({ pressed }) => [
                        styles.purchaseButton,
                        disabled && styles.purchaseButtonDisabled,
                        pressed && !disabled && styles.purchaseButtonPressed,
                      ]}
                      disabled={disabled}
                      onPress={() => purchaseProduct(item)}
                    >
                      {isProcessing ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
                        <Text style={styles.purchaseButtonText}>
                          {storeProduct
                            ? billingMode === 'mock' ? 'Mock으로 구매' : 'Google Play로 구매'
                            : '상품 확인 중'}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                )
              })}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>최근 충전 내역</Text>
                <Text style={styles.sectionSubtitle}>최근 결제 10건을 확인할 수 있어요.</Text>
              </View>
              {connected && billingMode === 'google-play' ? (
                <Pressable style={styles.historyRefresh} onPress={recoverPurchases}>
                  <Ionicons name="refresh" size={16} color="#2563EB" />
                  <Text style={styles.historyRefreshText}>결제 확인</Text>
                </Pressable>
              ) : null}
            </View>

            {purchases.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="receipt-outline" size={24} color="#94A3B8" />
                <Text style={styles.emptyTitle}>아직 충전 내역이 없어요</Text>
                <Text style={styles.emptyDescription}>첫 CASH 충전 기록이 여기에 표시됩니다.</Text>
              </View>
            ) : (
              <View style={styles.historyCard}>
                {purchases.map((purchase, index) => {
                  const paid = purchase.status === 'PAID'
                  const pending = purchase.status === 'PENDING'
                  const label = paid ? '충전 완료' : pending ? '결제 확인 중' : '처리 종료'
                  return (
                    <View key={purchase.id} style={[styles.historyRow, index > 0 && styles.historyRowBorder]}>
                      <View style={[styles.historyIcon, paid && styles.historyIconPaid]}>
                        <Ionicons
                          name={paid ? 'checkmark' : pending ? 'time-outline' : 'remove'}
                          size={18}
                          color={paid ? '#15803D' : '#64748B'}
                        />
                      </View>
                      <View style={styles.historyCopy}>
                        <Text style={styles.historyTitle}>{purchase.cash_granted.toLocaleString()} CASH</Text>
                        <Text style={styles.historyDate}>
                          {purchase.created_at ? new Date(purchase.created_at).toLocaleDateString('ko-KR') : '날짜 정보 없음'}
                        </Text>
                      </View>
                      {purchase.provider === 'MOCK' ? (
                        <View style={styles.historyProviderChip}>
                          <Text style={styles.historyProviderText}>MOCK</Text>
                        </View>
                      ) : null}
                      <View style={[styles.statusChip, paid && styles.statusChipPaid]}>
                        <Text style={[styles.statusText, paid && styles.statusTextPaid]}>{label}</Text>
                      </View>
                    </View>
                  )
                })}
              </View>
            )}
          </View>

          <Text style={styles.footnote}>
            {billingMode === 'mock'
              ? '개발 전용 서버가 DB 상품을 확인한 뒤 Mock 구매와 CASH 지급을 함께 처리합니다.'
              : '결제 완료와 CASH 지급은 서버에서 Google Play 구매를 확인한 뒤 처리됩니다.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F7FB' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 34 },
  content: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: 22 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F7FB' },
  mockBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#FFEDD5' },
  mockBadgeText: { color: '#9A3412', fontSize: 11, fontWeight: '800' },
  feedback: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, backgroundColor: '#EFF6FF' },
  feedbackSuccess: { backgroundColor: '#F0FDF4' },
  feedbackError: { backgroundColor: '#FEF2F2' },
  feedbackText: { flex: 1, color: '#1D4ED8', fontSize: 13, lineHeight: 19, fontWeight: '600' },
  feedbackTextSuccess: { color: '#166534' },
  feedbackTextError: { color: '#991B1B' },
  noticeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, backgroundColor: '#FFFFFF' },
  noticeIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF' },
  noticeCopy: { flex: 1 },
  noticeTitle: { color: '#1E293B', fontSize: 14, fontWeight: '700' },
  noticeDescription: { color: '#64748B', fontSize: 12, lineHeight: 18, marginTop: 3 },
  section: { gap: 11 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { color: '#334155', fontSize: 16, fontWeight: '800' },
  sectionSubtitle: { color: '#94A3B8', fontSize: 11, marginTop: 3 },
  productList: { gap: 11 },
  productCard: { padding: 18, borderRadius: 21, backgroundColor: '#FFFFFF' },
  productTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cashIcon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFBEB' },
  productCopy: { flex: 1 },
  productTitle: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  cashAmount: { color: '#0F172A', fontSize: 19, fontWeight: '800', marginTop: 3 },
  localizedPrice: { color: '#1E293B', fontSize: 15, fontWeight: '800' },
  purchaseButton: { height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563EB', marginTop: 16 },
  purchaseButtonDisabled: { backgroundColor: '#CBD5E1' },
  purchaseButtonPressed: { opacity: 0.88 },
  purchaseButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  historyRefresh: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, borderRadius: 12, backgroundColor: '#EFF6FF' },
  historyRefreshText: { color: '#2563EB', fontSize: 11, fontWeight: '700' },
  emptyCard: { padding: 24, borderRadius: 20, alignItems: 'center', backgroundColor: '#FFFFFF' },
  emptyTitle: { color: '#334155', fontSize: 14, fontWeight: '700', marginTop: 9 },
  emptyDescription: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  historyCard: { paddingHorizontal: 17, borderRadius: 20, backgroundColor: '#FFFFFF' },
  historyRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 11 },
  historyRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E2E8F0' },
  historyIcon: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9' },
  historyIconPaid: { backgroundColor: '#F0FDF4' },
  historyCopy: { flex: 1 },
  historyTitle: { color: '#1E293B', fontSize: 14, fontWeight: '700' },
  historyDate: { color: '#94A3B8', fontSize: 11, marginTop: 4 },
  historyProviderChip: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, backgroundColor: '#FFEDD5' },
  historyProviderText: { color: '#9A3412', fontSize: 9, fontWeight: '800' },
  statusChip: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999, backgroundColor: '#F1F5F9' },
  statusChipPaid: { backgroundColor: '#DCFCE7' },
  statusText: { color: '#64748B', fontSize: 10, fontWeight: '700' },
  statusTextPaid: { color: '#15803D' },
  footnote: { color: '#94A3B8', fontSize: 11, lineHeight: 17, textAlign: 'center', paddingHorizontal: 16 },
})
