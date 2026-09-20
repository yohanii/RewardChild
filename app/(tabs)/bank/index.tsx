import {
  CoinBadge,
  FantasyCard,
  type FantasyIconName,
  ParchmentCard,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
  StatusChip,
} from '@/src/components/common/FantasyPrimitives'
import { ScreenLoading, StateCard } from '@/src/components/common/ScreenState'
import { useBankScreen, type BankFeedback, type BankPurchase } from '@/src/hooks/useBankScreen'
import { colors, layout, radius, shadows, spacing, type StatusTone, typography } from '@/src/theme/tokens'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import {
  Platform,
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
  const palette = isSuccess
    ? { color: colors.success, background: colors.successSoft, icon: 'checkmark-circle' as const }
    : isError
      ? { color: colors.danger, background: colors.dangerSoft, icon: 'alert-circle' as const }
      : { color: colors.bank, background: colors.bankSoft, icon: 'information-circle' as const }

  return (
    <FantasyCard style={[styles.feedback, { backgroundColor: palette.background, borderColor: palette.color }]}>
      <Ionicons name={palette.icon} size={21} color={palette.color} />
      <Text style={[styles.feedbackText, { color: palette.color }]}>{feedback.message}</Text>
    </FantasyCard>
  )
}

function getPurchasePresentation(status: BankPurchase['status']): {
  label: string
  description: string
  tone: StatusTone
  icon: FantasyIconName
} {
  switch (status) {
    case 'PAID':
      return {
        label: '충전 완료',
        description: '결제 확인과 충전 금화 반영이 완료됐어요.',
        tone: 'success',
        icon: 'checkmark-done-outline',
      }
    case 'PENDING':
      return {
        label: '결제 확인 중',
        description: '안전하게 확인한 뒤 충전 금화에 반영해요.',
        tone: 'warning',
        icon: 'time-outline',
      }
    case 'CANCELLED':
      return {
        label: '결제 취소',
        description: '취소되어 금화가 충전되지 않은 기록이에요.',
        tone: 'neutral',
        icon: 'close-outline',
      }
    case 'REFUNDED':
      return {
        label: '환불 완료',
        description: '환불 처리가 끝난 거래 기록이에요.',
        tone: 'info',
        icon: 'return-down-back-outline',
      }
  }
}

export default function BankScreen() {
  const {
    balance,
    ready,
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
    retryBankData,
    refreshBankData,
  } = useBankScreen()

  if (loading) {
    return <ScreenLoading label="금화 장부를 확인하는 중..." />
  }

  if (!ready) {
    return (
      <StateCard
        fullScreen
        icon="cloud-offline-outline"
        title="은행 장부를 불러오지 못했어요."
        description="네트워크 연결을 확인하고 다시 시도해 주세요."
        actionLabel="다시 시도"
        onAction={retryBankData}
      />
    )
  }

  const totalBalance = balance.attendance + balance.cash

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshBankData}
            tintColor={colors.bank}
            colors={[colors.bank]}
          />
        )}
      >
        <View style={styles.content}>
          <View style={styles.hero}>
            <View style={styles.heroMark} accessibilityElementsHidden>
              <Ionicons name="scale-outline" size={64} color={colors.accentGold} />
            </View>
            <View style={styles.heroTopRow}>
              <StatusChip label="안경 쓴 너구리 은행장" tone="bank" />
              <CoinBadge amount={totalBalance} compact />
            </View>
            <View style={styles.heroTitleRow}>
              <View style={styles.heroEmblem}>
                <Ionicons name="library-outline" size={29} color={colors.accentGold} />
              </View>
              <View style={styles.heroCopy}>
                <Text style={styles.heroEyebrow}>금화 보관소 · 정산 장부실</Text>
                <Text style={styles.heroTitle}>왕실 금화 은행</Text>
                <Text style={styles.heroDescription}>금화 장부를 확인하고 필요한 만큼 안전하게 충전하세요.</Text>
              </View>
            </View>
            <View style={styles.heroTrustRow}>
              <View style={styles.heroTrustItem}>
                <Ionicons name="shield-checkmark-outline" size={17} color={colors.accentGold} />
                <Text style={styles.heroTrustText}>서버 확인 후 반영</Text>
              </View>
              <View style={styles.heroTrustDivider} />
              <View style={styles.heroTrustItem}>
                <Ionicons name="book-outline" size={17} color={colors.accentGold} />
                <Text style={styles.heroTrustText}>정확한 거래 기록</Text>
              </View>
            </View>
          </View>

          {billingMode === 'mock' ? (
            <View style={styles.mockRow}>
              <StatusChip label="개발 전용 Mock 결제" tone="warning" />
              <Text style={styles.mockDescription}>실제 결제 없이 서버 충전 흐름을 검증합니다.</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <SectionHeader title="보유 금화 장부" subtitle="출석 금화와 충전 금화를 구분해 관리해요." />
            <ParchmentCard style={styles.balanceLedger}>
              <View style={styles.ledgerTopRow}>
                <View>
                  <Text style={styles.ledgerEyebrow}>TOTAL BALANCE</Text>
                  <Text style={styles.ledgerTitle}>총 보유 금화</Text>
                </View>
                <CoinBadge amount={totalBalance} />
              </View>
              <View style={styles.balanceRows}>
                <View style={styles.balanceRow}>
                  <View style={[styles.balanceIcon, styles.attendanceIcon]}>
                    <Ionicons name="calendar-outline" size={21} color={colors.primary} />
                  </View>
                  <View style={styles.balanceCopy}>
                    <Text style={styles.balanceTitle}>출석 금화</Text>
                    <Text style={styles.balanceEnum}>ATTENDANCE</Text>
                  </View>
                  <Text style={styles.balanceAmount}>{balance.attendance.toLocaleString()}</Text>
                </View>
                <View style={styles.balanceDivider} />
                <View style={styles.balanceRow}>
                  <View style={[styles.balanceIcon, styles.cashIcon]}>
                    <Ionicons name="cash-outline" size={21} color={colors.bank} />
                  </View>
                  <View style={styles.balanceCopy}>
                    <Text style={styles.balanceTitle}>충전 금화</Text>
                    <Text style={styles.balanceEnum}>CASH</Text>
                  </View>
                  <Text style={styles.balanceAmount}>{balance.cash.toLocaleString()}</Text>
                </View>
              </View>
              <Text style={styles.balanceFootnote}>충전 금화는 결제가 안전하게 확인된 뒤 장부에 반영됩니다.</Text>
            </ParchmentCard>
          </View>

          {feedback ? <FeedbackBanner feedback={feedback} /> : null}

          {billingMode === 'google-play' && Platform.OS !== 'android' ? (
            <FantasyCard style={styles.noticeCard}>
              <View style={styles.noticeIcon}>
                <Ionicons name="logo-google-playstore" size={23} color={colors.bank} />
              </View>
              <View style={styles.noticeCopy}>
                <Text style={styles.noticeTitle}>Android 전용 충전 기능</Text>
                <Text style={styles.noticeDescription}>실제 구매는 Android development build에서 확인할 수 있어요.</Text>
              </View>
            </FantasyCard>
          ) : billingMode === 'google-play' && !connected ? (
            <FantasyCard style={styles.noticeCard}>
              <View style={styles.noticeIcon}>
                <Ionicons name="cloud-offline-outline" size={23} color={colors.warning} />
              </View>
              <View style={styles.noticeCopy}>
                <Text style={styles.noticeTitle}>결제 서비스 연결 확인 중</Text>
                <Text style={styles.noticeDescription}>연결이 오래 걸리면 다시 연결해 주세요.</Text>
              </View>
              <SecondaryButton
                label="다시 연결"
                onPress={reconnectBilling}
                style={styles.reconnectButton}
              />
            </FantasyCard>
          ) : null}

          <View style={styles.section}>
            <SectionHeader
              title="금화 충전소"
              subtitle={billingMode === 'mock'
                ? '활성화된 개발용 환전 상품으로 충전해요.'
                : 'Google Play에서 제공하는 실제 가격으로 결제해요.'}
            />
            <View style={styles.productList}>
              {items.length === 0 ? (
                <StateCard
                  icon="card-outline"
                  title="현재 이용 가능한 환전 상품이 없어요."
                  description="상품 준비가 끝나면 이곳에 표시됩니다."
                />
              ) : items.map((item, index) => {
                const productId = item.google_play_product_id
                const storeProduct = productId ? storeProducts.get(productId) : undefined
                const isProcessing = processingProductId === productId
                const disabled = !connected || !storeProduct || Boolean(processingProductId)

                return (
                  <FantasyCard key={item.id} style={styles.productCard}>
                    <View style={styles.productHeader}>
                      <View style={styles.productEmblem}>
                        <Ionicons name={index === 2 ? 'file-tray-stacked-outline' : 'cash-outline'} size={25} color={colors.accentGold} />
                      </View>
                      <View style={styles.productCopy}>
                        <Text style={styles.productEyebrow}>환전 상품 {index + 1}</Text>
                        <Text style={styles.productTitle}>{item.title}</Text>
                      </View>
                      <StatusChip label={billingMode === 'mock' ? '개발용' : 'Google Play'} tone={billingMode === 'mock' ? 'warning' : 'bank'} />
                    </View>
                    <View style={styles.exchangeRow}>
                      <View>
                        <Text style={styles.exchangeLabel}>지급되는 충전 금화</Text>
                        <CoinBadge amount={item.cash_amount} unit="CASH" />
                      </View>
                      <View style={styles.priceCopy}>
                        <Text style={styles.priceLabel}>결제 가격</Text>
                        <Text style={styles.localizedPrice}>{storeProduct?.displayPrice ?? '가격 확인 중'}</Text>
                      </View>
                    </View>
                    <PrimaryButton
                      label={storeProduct
                        ? billingMode === 'mock' ? '개발용 충전 실행' : 'Google Play에서 충전'
                        : '상품 확인 중'}
                      onPress={() => purchaseProduct(item)}
                      disabled={disabled}
                      loading={isProcessing}
                      leading={<Ionicons name="shield-checkmark-outline" size={18} color={colors.onPrimary} />}
                      style={styles.purchaseButton}
                    />
                  </FantasyCard>
                )
              })}
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="금화 거래 장부"
              subtitle="최근 결제 10건의 처리 결과를 기록해요."
              actionLabel={connected && billingMode === 'google-play' ? '결제 다시 확인' : undefined}
              onAction={connected && billingMode === 'google-play' ? recoverPurchases : undefined}
            />
            {purchases.length === 0 ? (
              <StateCard
                icon="receipt-outline"
                title="아직 충전 기록이 없어요."
                description="첫 충전 거래가 완료되면 장부에 기록됩니다."
              />
            ) : (
              <View style={styles.historyList}>
                {purchases.map((purchase, index) => {
                  const presentation = getPurchasePresentation(purchase.status)
                  return (
                    <ParchmentCard key={purchase.id} style={styles.historyCard}>
                      <View style={styles.historyIndex}>
                        <Text style={styles.historyIndexText}>{String(index + 1).padStart(2, '0')}</Text>
                      </View>
                      <View style={[styles.historyIcon, { backgroundColor: presentation.tone === 'success' ? colors.successSoft : presentation.tone === 'warning' ? colors.warningSoft : colors.bankSoft }]}>
                        <Ionicons name={presentation.icon} size={21} color={presentation.tone === 'success' ? colors.success : presentation.tone === 'warning' ? colors.warning : colors.bank} />
                      </View>
                      <View style={styles.historyCopy}>
                        <View style={styles.historyTitleRow}>
                          <Text style={styles.historyTitle}>{purchase.cash_granted.toLocaleString()} CASH</Text>
                          {billingMode === 'mock' && purchase.provider === 'MOCK' ? (
                            <StatusChip label="개발 Mock" tone="warning" />
                          ) : null}
                        </View>
                        <Text style={styles.historyDescription}>{presentation.description}</Text>
                        <Text style={styles.historyDate}>
                          {purchase.created_at ? new Date(purchase.created_at).toLocaleDateString('ko-KR') : '날짜 정보 없음'}
                        </Text>
                      </View>
                      <StatusChip label={presentation.label} tone={presentation.tone} />
                    </ParchmentCard>
                  )
                })}
              </View>
            )}
          </View>

          <ParchmentCard style={styles.policyCard}>
            <Ionicons name="shield-checkmark-outline" size={21} color={colors.bank} />
            <Text style={styles.policyText}>
              {billingMode === 'mock'
                ? '개발 전용 서버가 등록된 상품과 지급 금액을 확인한 뒤 충전합니다.'
                : '결제 결과와 지급 금액은 서버에서 확인하며, 필요한 마무리 작업은 자동으로 재시도됩니다.'}
            </Text>
          </ParchmentCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  content: { width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center', gap: spacing.xl },
  hero: {
    padding: spacing.lg,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.accentGold,
    backgroundColor: colors.bank,
    overflow: 'hidden',
    ...shadows.raised,
  },
  heroMark: { position: 'absolute', right: -5, bottom: -4, opacity: 0.14 },
  heroTopRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  heroTitleRow: { marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  heroEmblem: {
    width: 56,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.11)',
    borderWidth: 1,
    borderColor: colors.accentGold,
  },
  heroCopy: { flex: 1 },
  heroEyebrow: { ...typography.caption, color: colors.accentGold, fontWeight: '800' },
  heroTitle: { ...typography.screenTitle, marginTop: 1, color: colors.onPrimary },
  heroDescription: { ...typography.body, marginTop: spacing.xxs, color: colors.onPrimary, opacity: 0.88 },
  heroTrustRow: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 253, 247, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroTrustItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xxs },
  heroTrustText: { color: colors.onPrimary, fontSize: 10, lineHeight: 15, fontWeight: '700' },
  heroTrustDivider: { width: StyleSheet.hairlineWidth, height: 22, backgroundColor: 'rgba(255, 253, 247, 0.3)' },
  mockRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs },
  mockDescription: { ...typography.caption, flex: 1, minWidth: 180, color: colors.textSecondary },
  section: { gap: spacing.sm },
  balanceLedger: { gap: spacing.md },
  ledgerTopRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  ledgerEyebrow: { color: colors.bank, fontSize: 9, lineHeight: 12, fontWeight: '800', letterSpacing: 1.2 },
  ledgerTitle: { ...typography.cardTitle, marginTop: 2, color: colors.textPrimary },
  balanceRows: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  balanceRow: { minHeight: 70, padding: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  balanceDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: spacing.sm, backgroundColor: colors.border },
  balanceIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  attendanceIcon: { backgroundColor: colors.goldSoft },
  cashIcon: { backgroundColor: colors.bankSoft },
  balanceCopy: { flex: 1 },
  balanceTitle: { ...typography.cardTitle, color: colors.textPrimary },
  balanceEnum: { color: colors.textSecondary, fontSize: 9, lineHeight: 13, fontWeight: '800', letterSpacing: 0.8 },
  balanceAmount: { ...typography.coin, color: colors.textPrimary },
  balanceFootnote: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  feedback: { padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  feedbackText: { ...typography.body, flex: 1, fontWeight: '600' },
  noticeCard: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface },
  noticeIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bankSoft },
  noticeCopy: { flex: 1, minWidth: 150 },
  noticeTitle: { ...typography.cardTitle, color: colors.textPrimary },
  noticeDescription: { ...typography.caption, marginTop: 2, color: colors.textSecondary },
  reconnectButton: { minHeight: 40, borderColor: colors.bank },
  productList: { gap: spacing.sm },
  productCard: { backgroundColor: colors.surface, borderColor: colors.bank },
  productHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  productEmblem: { width: 48, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bank, borderWidth: 1, borderColor: colors.accentGold },
  productCopy: { flex: 1 },
  productEyebrow: { ...typography.caption, color: colors.bank, fontSize: 10, lineHeight: 14, fontWeight: '800' },
  productTitle: { ...typography.cardTitle, marginTop: 1, color: colors.textPrimary },
  exchangeRow: {
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
    backgroundColor: colors.parchment,
  },
  exchangeLabel: { ...typography.caption, marginBottom: spacing.xxs, color: colors.textSecondary, fontWeight: '700' },
  priceCopy: { alignItems: 'flex-end' },
  priceLabel: { color: colors.textSecondary, fontSize: 10, lineHeight: 14, fontWeight: '700' },
  localizedPrice: { ...typography.cardTitle, marginTop: spacing.xxs, color: colors.textPrimary },
  purchaseButton: { marginTop: spacing.md, backgroundColor: colors.bank },
  historyList: { gap: spacing.sm },
  historyCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface },
  historyIndex: { alignSelf: 'stretch', width: 24, alignItems: 'center', justifyContent: 'center', borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.border },
  historyIndexText: { color: colors.textSecondary, fontSize: 9, lineHeight: 12, fontWeight: '800' },
  historyIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  historyCopy: { flex: 1 },
  historyTitleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs },
  historyTitle: { ...typography.cardTitle, color: colors.textPrimary },
  historyDescription: { ...typography.caption, marginTop: 2, color: colors.textSecondary },
  historyDate: { color: colors.textSecondary, fontSize: 10, lineHeight: 14, marginTop: spacing.xxs },
  policyCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: colors.bankSoft },
  policyText: { ...typography.caption, flex: 1, color: colors.textPrimary },
})
