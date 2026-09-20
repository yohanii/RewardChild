import {
  CoinBadge,
  PrimaryButton,
  SectionHeader,
  StatusChip,
} from '@/src/components/common/FantasyPrimitives'
import { ScreenLoading, StateCard } from '@/src/components/common/ScreenState'
import { ShopItemCard } from '@/src/components/shop/ShopItemCard'
import { ShopItemCreateModal } from '@/src/components/shop/ShopItemCreateModal'
import { ShopPurchaseCard } from '@/src/components/shop/ShopPurchaseCard'
import { type ShopItem, useShopScreen } from '@/src/hooks/useShopScreen'
import { colors, layout, radius, shadows, spacing, typography } from '@/src/theme/tokens'
import { showAlert } from '@/src/utils/alert'
import { confirmAsync } from '@/src/utils/confirmAsync'
import { Ionicons } from '@expo/vector-icons'
import React, { useState } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ShopScreen() {
  const {
    profile, balance, loading, refreshing, error, mutating, orderedItems, purchases, purchasedSet, childNames,
    targetRelationState, createItem, updateItem, deactivateItem, purchaseItem,
    fulfillPurchase, refresh, retry,
  } = useShopScreen()
  const [createVisible, setCreateVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null)

  if (loading && !profile) {
    return <ScreenLoading label="보상 상점의 문을 여는 중..." />
  }
  if (!profile) {
    return (
      <StateCard
        fullScreen
        icon="cloud-offline-outline"
        title={error ?? '보상 상점을 표시할 수 없어요.'}
        description="네트워크 연결을 확인하고 다시 시도해 주세요."
        actionLabel="다시 시도"
        onAction={retry}
      />
    )
  }

  const isParent = profile.role === 'PARENT'
  const roleAccent = isParent ? colors.parent : colors.child
  const roleSoft = isParent ? colors.parentSoft : colors.childSoft
  const itemTitles = new Map(orderedItems.map((item) => [item.id, item.title]))

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
            onRefresh={refresh}
            tintColor={roleAccent}
            colors={[roleAccent]}
          />
        )}
      >
        <View style={styles.content}>
          <View style={styles.hero}>
            <View style={styles.heroGlow} accessibilityElementsHidden>
              <Ionicons name="flame-outline" size={58} color={colors.accentGold} />
            </View>
            <View style={styles.heroTopRow}>
              <StatusChip label={isParent ? '검은 고양이 상점 주인' : '보상을 고르는 모험가'} tone={isParent ? 'parent' : 'child'} />
              {targetRelationState === 'READY' ? <CoinBadge amount={balance} compact /> : null}
            </View>
            <View style={styles.heroTitleRow}>
              <View style={[styles.heroEmblem, { backgroundColor: roleSoft }]}>
                <Ionicons name={isParent ? 'storefront-outline' : 'gift-outline'} size={28} color={roleAccent} />
              </View>
              <View style={styles.heroCopy}>
                <Text style={styles.heroEyebrow}>따뜻한 랜턴 아래 · 보상 상점</Text>
                <Text style={styles.heroTitle}>검은 고양이의 상점</Text>
                <Text style={styles.heroDescription}>
                  {isParent
                    ? '오늘 상점의 보상을 관리하고 아이의 주문을 확인해 보세요.'
                    : '모은 금화로 어떤 현실 보상을 골라볼까요?'}
                </Text>
              </View>
            </View>
            <View style={styles.realityNotice}>
              <Ionicons name="heart-outline" size={17} color={colors.accentGold} />
              <Text style={styles.realityNoticeText}>이곳의 보상은 가족이 현실에서 함께 제공하고 경험하는 약속이에요.</Text>
            </View>
            {isParent ? (
              <PrimaryButton
                label="새 보상 등록"
                onPress={() => setCreateVisible(true)}
                leading={<Ionicons name="add-circle-outline" size={18} color={colors.onPrimary} />}
                style={styles.createButton}
              />
            ) : null}
          </View>

          {error ? (
            <StateCard
              icon="cloud-offline-outline"
              title={error}
              description="기존 진열 정보는 유지했어요. 다시 조회해 주세요."
              actionLabel="다시 시도"
              onAction={retry}
            />
          ) : null}

          {targetRelationState !== 'READY' ? (
            <StateCard
              icon="people-outline"
              title={targetRelationState === 'MULTIPLE' ? '가족 선택 기능을 준비 중이에요.' : '활성 가족 관계가 없어요.'}
              description={targetRelationState === 'MULTIPLE'
                ? '한 명을 임의로 선택하지 않아 잔액은 숨기고, 주문서는 자녀 이름과 함께 표시해요.'
                : '가족과 연결되면 보상과 잔액을 확인할 수 있어요.'}
            />
          ) : null}

          <View style={styles.section}>
            <SectionHeader
              title={isParent ? '보상 진열대' : '고를 수 있는 보상'}
              subtitle={isParent ? '가족이 실제로 제공할 경험과 보상을 관리해요.' : '원하는 보상을 골라 금화로 요청해 보세요.'}
            />
            <View style={styles.shelf}>
              <View style={styles.shelfRail} accessibilityElementsHidden>
                <View style={styles.shelfNail} />
                <Text style={styles.shelfLabel}>REAL-WORLD REWARDS</Text>
                <View style={styles.shelfNail} />
              </View>
              <View style={styles.shelfCountRow}>
                <Text style={styles.shelfCountLabel}>{isParent ? '등록된 보상' : '오늘의 진열'}</Text>
                <View style={styles.shelfCountBadge}><Text style={styles.shelfCount}>{orderedItems.length}</Text></View>
              </View>
              {loading ? (
                <View style={styles.loadingInline}><ActivityIndicator color={roleAccent} /></View>
              ) : orderedItems.length === 0 ? (
                <StateCard
                  icon="gift-outline"
                  title="아직 진열된 보상이 없어요."
                  description={isParent ? '첫 번째 현실 보상을 등록해 보세요.' : '부모님이 보상을 등록하면 이곳에 표시돼요.'}
                />
              ) : (
                orderedItems.map((item) => (
                  <ShopItemCard
                    key={item.id}
                    item={item}
                    purchased={purchasedSet.has(item.id)}
                    isParent={isParent}
                    mutating={mutating}
                    onEdit={() => setEditingItem(item)}
                    onDeactivate={async () => {
                      const confirmed = await confirmAsync(
                        '판매 중지',
                        '자녀의 상점 진열대에서 이 보상을 내릴까요?',
                      )
                      if (!confirmed) return
                      try {
                        await deactivateItem(item.id)
                      } catch {
                        showAlert('판매 중지 실패', '잠시 후 다시 시도해 주세요.')
                      }
                    }}
                    onPurchase={async () => {
                      const confirmed = await confirmAsync(
                        '이 보상 받기',
                        `${item.price.toLocaleString()} COIN을 사용해 이 보상을 요청할까요?`,
                      )
                      if (!confirmed) return
                      try {
                        const purchased = await purchaseItem(item.id)
                        if (purchased) showAlert('보상 구매 완료', '주문서와 잔액에 반영됐어요.')
                      } catch {
                        showAlert('보상 구매 실패', '잔액과 보상 상태를 확인한 뒤 다시 시도해 주세요.')
                      }
                    }}
                  />
                ))
              )}
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader
              title={isParent ? '보상 전달 주문서' : '내 보상 주문서'}
              subtitle={isParent ? '자녀에게 실제 보상을 전달하고 완료 처리해요.' : '구매한 보상의 전달 상태를 확인해요.'}
            />
            {purchases.length === 0 ? (
              <StateCard
                icon="receipt-outline"
                title="아직 작성된 주문서가 없어요."
                description={isParent ? '자녀가 보상을 구매하면 이곳에서 전달 상태를 관리할 수 있어요.' : '보상을 구매하면 이곳에서 전달 상태를 확인할 수 있어요.'}
              />
            ) : (
              <View style={styles.purchaseList}>
                {purchases.map((purchase) => (
                  <ShopPurchaseCard
                    key={purchase.id}
                    purchase={purchase}
                    itemTitle={itemTitles.get(purchase.shop_item_id)}
                    childName={childNames[purchase.child_id]}
                    isParent={isParent}
                    mutating={mutating}
                    onFulfill={async () => {
                      const confirmed = await confirmAsync(
                        '보상 전달 완료',
                        '자녀에게 실제 보상을 전달했나요? 완료 후에는 되돌릴 수 없어요.',
                      )
                      if (!confirmed) return
                      try {
                        await fulfillPurchase(purchase.id)
                      } catch {
                        showAlert('전달 완료 처리 실패', '잠시 후 다시 시도해 주세요.')
                      }
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <ShopItemCreateModal
        visible={createVisible}
        mutating={mutating}
        onClose={() => setCreateVisible(false)}
        onSubmit={async (payload) => {
          try {
            await createItem(payload)
            setCreateVisible(false)
          } catch {
            showAlert('보상 등록 실패', '입력 내용을 확인한 뒤 다시 시도해 주세요.')
          }
        }}
      />
      <ShopItemCreateModal
        visible={editingItem !== null}
        mutating={mutating}
        initialItem={editingItem ?? undefined}
        onClose={() => setEditingItem(null)}
        onSubmit={async (payload) => {
          if (!editingItem) return
          try {
            await updateItem({ id: editingItem.id, ...payload })
            setEditingItem(null)
          } catch {
            showAlert('보상 수정 실패', '입력 내용을 확인한 뒤 다시 시도해 주세요.')
          }
        }}
      />
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
    backgroundColor: colors.wood,
    overflow: 'hidden',
    ...shadows.raised,
  },
  heroGlow: { position: 'absolute', right: -8, bottom: 10, opacity: 0.18 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  heroTitleRow: { marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  heroEmblem: {
    width: 54,
    height: 62,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accentGold,
  },
  heroCopy: { flex: 1 },
  heroEyebrow: { ...typography.caption, color: colors.accentGold, fontWeight: '800' },
  heroTitle: { ...typography.screenTitle, marginTop: 1, color: colors.onPrimary },
  heroDescription: { ...typography.body, marginTop: spacing.xxs, color: colors.onPrimary, opacity: 0.88 },
  realityNotice: {
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: 'rgba(255, 253, 247, 0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 253, 247, 0.32)',
  },
  realityNoticeText: { ...typography.caption, flex: 1, color: colors.onPrimary },
  createButton: { marginTop: spacing.md, backgroundColor: colors.parent },
  section: { gap: spacing.sm },
  shelf: {
    padding: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.accentGold,
    backgroundColor: colors.wood,
    gap: spacing.sm,
    ...shadows.raised,
  },
  shelfRail: {
    minHeight: 34,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.accentGold,
  },
  shelfNail: { width: 7, height: 7, borderRadius: radius.pill, backgroundColor: colors.accentGold },
  shelfLabel: { color: colors.onPrimary, fontSize: 10, lineHeight: 14, fontWeight: '800', letterSpacing: 1.1 },
  shelfCountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xxs },
  shelfCountLabel: { ...typography.caption, color: colors.parchment, fontWeight: '700' },
  shelfCountBadge: { minWidth: 28, paddingHorizontal: spacing.xs, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: colors.goldSoft },
  shelfCount: { color: colors.onGold, fontSize: 11, lineHeight: 16, fontWeight: '800', textAlign: 'center' },
  loadingInline: { paddingVertical: spacing['2xl'] },
  purchaseList: { gap: spacing.sm },
})
