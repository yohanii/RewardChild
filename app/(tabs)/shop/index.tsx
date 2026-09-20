import { BalanceCard } from '@/src/components/common/BalanceCard'
import { ScreenHeader } from '@/src/components/common/ScreenHeader'
import { ScreenLoading, StateCard } from '@/src/components/common/ScreenState'
import { ShopItemCard } from '@/src/components/shop/ShopItemCard'
import { ShopItemCreateModal } from '@/src/components/shop/ShopItemCreateModal'
import { ShopPurchaseCard } from '@/src/components/shop/ShopPurchaseCard'
import { type ShopItem, useShopScreen } from '@/src/hooks/useShopScreen'
import { confirmAsync } from '@/src/utils/confirmAsync'
import { showAlert } from '@/src/utils/alert'
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
    return <ScreenLoading label="상점 정보를 불러오는 중..." />
  }
  if (!profile) {
    return (
      <StateCard fullScreen icon="cloud-offline-outline" title={error ?? '상점 정보를 표시할 수 없어요.'} description="네트워크 연결을 확인하고 다시 시도해 주세요." actionLabel="다시 시도" onAction={retry} />
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
            <StateCard icon="cloud-offline-outline" title={error} description="기존 화면은 유지했어요. 다시 조회해 주세요." actionLabel="다시 시도" onAction={retry} />
          )}
          {targetRelationState !== 'READY' ? (
            <StateCard
              icon="people-outline"
              title={targetRelationState === 'MULTIPLE' ? '가족 선택 기능을 준비 중이에요.' : '활성 가족 관계가 없어요.'}
              description={targetRelationState === 'MULTIPLE'
                ? '한 명을 임의로 선택하지 않아 자녀별 잔액은 숨기고, 구매 이력은 이름과 함께 표시해요.'
                : '가족과 연결되면 이곳에서 관계별 정보를 확인할 수 있어요.'}
            />
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
                <StateCard
                  icon="bag-handle-outline"
                  title="아직 등록된 아이템이 없어요."
                  description={isParent ? '첫 번째 보상을 만들어 보세요.' : '부모님이 보상을 등록하면 이곳에 표시돼요.'}
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
                        '상품 비활성화',
                        '자녀의 상점에서 이 상품을 숨길까요?',
                      )
                      if (!confirmed) return
                      try {
                        await deactivateItem(item.id)
                      } catch {
                        showAlert('비활성화 실패', '잠시 후 다시 시도해 주세요.')
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
                      } catch {
                        showAlert('구매 실패', '잔액과 상품 상태를 확인한 뒤 다시 시도해 주세요.')
                      }
                    }}
                  />
                ))
              )}

              <Text style={[styles.sectionTitle, styles.purchaseSectionTitle]}>구매 이력</Text>
              {purchases.length === 0 ? (
                <StateCard
                  icon="receipt-outline"
                  title="아직 구매 이력이 없어요."
                  description={isParent ? '자녀가 상품을 구매하면 이곳에서 이행 상태를 관리할 수 있어요.' : '상품을 구매하면 이곳에서 제공 상태를 확인할 수 있어요.'}
                />
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
                      } catch {
                        showAlert('이행 처리 실패', '잠시 후 다시 시도해 주세요.')
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
          } catch {
            showAlert('상품 등록 실패', '입력 내용을 확인한 뒤 다시 시도해 주세요.')
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
            showAlert('상품 수정 실패', '입력 내용을 확인한 뒤 다시 시도해 주세요.')
          }
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F7FB' },
  content: { flex: 1, width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 16, gap: 18 },
  sectionTitle: { color: '#334155', fontSize: 16, fontWeight: '800', marginTop: 2 },
  purchaseSectionTitle: { marginTop: 8 },
  loadingInline: { paddingTop: 24 },
  list: { flex: 1, marginHorizontal: -2 },
  scrollContent: { paddingHorizontal: 2, paddingBottom: 28, gap: 12 },
})
