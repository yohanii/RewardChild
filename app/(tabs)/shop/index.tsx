import { BalanceCard } from '@/src/components/common/BalanceCard'
import { ScreenHeader } from '@/src/components/common/ScreenHeader'
import { ShopItemCard } from '@/src/components/shop/ShopItemCard'
import { ShopItemCreateModal } from '@/src/components/shop/ShopItemCreateModal'
import { ShopPurchaseCard } from '@/src/components/shop/ShopPurchaseCard'
import { type ShopItem, useShopScreen } from '@/src/hooks/useShopScreen'
import { confirmAsync } from '@/src/utils/confirmAsync'
import { showAlert } from '@/src/utils/alert'
import React, { useState } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
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
    return <View style={styles.loadingContainer}><ActivityIndicator color="#2563EB" /></View>
  }
  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centeredError}>
          <Text style={styles.errorTitle}>{error ?? '상점 정보를 표시할 수 없어요.'}</Text>
          <Text style={styles.errorSubtitle}>네트워크 연결을 확인하고 다시 시도해 주세요.</Text>
          <Pressable style={styles.retryButton} onPress={retry} accessibilityRole="button">
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  const isParent = profile?.role === 'PARENT'
  const itemTitles = new Map(orderedItems.map((item) => [item.id, item.title]))

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.content}>
        <ScreenHeader
          title="상점"
          subtitle={isParent ? '아이에게 보여줄 보상을 관리해요.' : '모은 코인으로 받을 보상을 골라 보세요.'}
          actionLabel={isParent ? '아이템 등록' : undefined}
          onAction={isParent ? () => setCreateVisible(true) : undefined}
        />
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          alwaysBounceVertical
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#2563EB" colors={['#2563EB']} />}
        >
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>{error}</Text>
              <Text style={styles.errorSubtitle}>기존 화면은 유지했어요. 다시 조회해 주세요.</Text>
              <Pressable style={styles.retryButton} onPress={retry} accessibilityRole="button">
                <Text style={styles.retryButtonText}>다시 시도</Text>
              </Pressable>
            </View>
          )}
          {targetRelationState !== 'READY' ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>
                {targetRelationState === 'MULTIPLE' ? '가족 선택 기능을 준비 중이에요.' : '활성 가족 관계가 없어요.'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {targetRelationState === 'MULTIPLE'
                  ? '한 명을 임의로 선택하지 않아 자녀별 잔액은 숨기고, 구매 이력은 이름과 함께 표시해요.'
                  : '가족과 연결되면 이곳에서 관계별 정보를 확인할 수 있어요.'}
              </Text>
            </View>
          ) : (
            <BalanceCard
              label={isParent ? '자녀의 보유 코인' : '사용 가능한 코인'}
              amount={balance}
              caption={isParent ? '연결된 자녀의 현재 재화를 표시하고 있어요.' : undefined}
              compact
            />
          )}
          <>
              <Text style={styles.sectionTitle}>보상 아이템</Text>

              {loading ? (
                <View style={styles.loadingInline}><ActivityIndicator color="#2563EB" /></View>
              ) : orderedItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>아직 등록된 아이템이 없어요.</Text>
                  <Text style={styles.emptySubtitle}>
                    {isParent ? '첫 번째 보상을 만들어 보세요.' : '부모님이 보상을 등록하면 이곳에 표시돼요.'}
                  </Text>
                </View>
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
                        '상품 비활성화',
                        '자녀의 상점에서 이 상품을 숨길까요?',
                      )
                      if (!confirmed) return
                      try {
                        await deactivateItem(item.id)
                      } catch (error) {
                        showAlert('비활성화 실패', error instanceof Error ? error.message : '다시 시도해주세요.')
                      }
                    }}
                    onPurchase={async () => {
                      const confirmed = await confirmAsync(
                        '상품 구매',
                        `${item.price.toLocaleString()} COIN으로 구매할까요?`,
                      )
                      if (!confirmed) return
                      try {
                        const purchased = await purchaseItem(item.id)
                        if (purchased) showAlert('구매 완료', '구매 내역과 잔액이 반영됐어요.')
                      } catch (error) {
                        showAlert('구매 실패', error instanceof Error ? error.message : '잔액과 상품 상태를 확인해주세요.')
                      }
                    }}
                  />
                ))
              )}

              <Text style={[styles.sectionTitle, styles.purchaseSectionTitle]}>구매 이력</Text>
              {purchases.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>아직 구매 이력이 없어요.</Text>
                  <Text style={styles.emptySubtitle}>
                    {isParent ? '자녀가 상품을 구매하면 이곳에서 이행 상태를 관리할 수 있어요.' : '상품을 구매하면 이곳에서 제공 상태를 확인할 수 있어요.'}
                  </Text>
                </View>
              ) : (
                purchases.map((purchase) => (
                  <ShopPurchaseCard
                    key={purchase.id}
                    purchase={purchase}
                    itemTitle={itemTitles.get(purchase.shop_item_id)}
                    childName={childNames[purchase.child_id]}
                    isParent={isParent}
                    mutating={mutating}
                    onFulfill={async () => {
                      const confirmed = await confirmAsync(
                        '보상 제공 완료',
                        '자녀에게 실제 보상을 제공했나요? 완료 후에는 되돌릴 수 없어요.',
                      )
                      if (!confirmed) return
                      try {
                        await fulfillPurchase(purchase.id)
                      } catch (error) {
                        showAlert('이행 처리 실패', error instanceof Error ? error.message : '다시 시도해주세요.')
                      }
                    }}
                  />
                ))
              )}
          </>
        </ScrollView>
      </View>

      <ShopItemCreateModal
        visible={createVisible}
        mutating={mutating}
        onClose={() => setCreateVisible(false)}
        onSubmit={async (payload) => {
          try {
            await createItem(payload)
            setCreateVisible(false)
          } catch (error) {
            showAlert('상품 등록 실패', error instanceof Error ? error.message : '다시 시도해주세요.')
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
          } catch (error) {
            showAlert('상품 수정 실패', error instanceof Error ? error.message : '다시 시도해주세요.')
          }
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F7FB' },
  content: { flex: 1, width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 16, gap: 18 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F7FB' },
  sectionTitle: { color: '#334155', fontSize: 16, fontWeight: '800', marginTop: 2 },
  purchaseSectionTitle: { marginTop: 8 },
  loadingInline: { paddingTop: 24 },
  emptyContainer: { padding: 20, borderRadius: 20, backgroundColor: '#FFFFFF' },
  emptyTitle: { color: '#1E293B', fontSize: 16, fontWeight: '700' },
  emptySubtitle: { color: '#64748B', fontSize: 13, lineHeight: 19, marginTop: 5 },
  centeredError: { flex: 1, margin: 20, padding: 22, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  errorContainer: { padding: 20, borderRadius: 20, alignItems: 'flex-start', backgroundColor: '#FFFFFF' },
  errorTitle: { color: '#1E293B', fontSize: 16, fontWeight: '700' },
  errorSubtitle: { color: '#64748B', fontSize: 13, lineHeight: 19, marginTop: 5 },
  retryButton: { marginTop: 14, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#2563EB' },
  retryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  list: { flex: 1, marginHorizontal: -2 },
  scrollContent: { paddingHorizontal: 2, paddingBottom: 28, gap: 12 },
})
