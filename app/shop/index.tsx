// app/shop/index.tsx
import { ShopItemCard } from '@/src/components/shop/ShopItemCard'
import { ShopItemCreateModal } from '@/src/components/shop/ShopItemCreateModal'
import { useShopScreen } from '@/src/hooks/useShopScreen'
import React, { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

export default function ShopScreen() {
  const {
    profile,
    balance,
    loading,
    mutating,
    orderedItems,
    purchasedSet,
    createItem,
    reload,
  } = useShopScreen()

  const [createVisible, setCreateVisible] = useState(false)

  if (loading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* 상단: 잔액 + 부모 전용 등록 버튼 */}
      <View style={styles.header}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>내 재화</Text>
          <Text style={styles.balanceValue}>{balance.toLocaleString()} COIN</Text>
          {profile?.role === 'PARENT' && (
            <Text style={styles.balanceHint}>자녀 재화를 표시 중</Text>
          )}
        </View>

        {profile?.role === 'PARENT' && (
          <Pressable style={styles.createButton} onPress={() => setCreateVisible(true)}>
            <Text style={styles.createButtonText}>아이템 등록</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>상점 아이템</Text>

        {loading ? (
          <View style={styles.loadingInlineContainer}>
            <ActivityIndicator />
          </View>
        ) : orderedItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>아직 등록된 상점 아이템이 없어요.</Text>
            <Text style={styles.emptySubtitle}>
              {profile?.role === 'PARENT'
                ? '아이템 등록 버튼으로 첫 번째 보상을 만들어보세요!'
                : '부모님이 보상을 등록하면 여기에서 볼 수 있어요.'}
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {orderedItems.map((item) => (
              <ShopItemCard
                key={item.id}
                item={item}
                purchased={purchasedSet.has(item.id)}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {/* 부모 전용: 아이템 생성 모달 */}
      <ShopItemCreateModal
        visible={createVisible}
        mutating={mutating}
        onClose={() => setCreateVisible(false)}
        onSubmit={async (payload) => {
          await createItem(payload)
          setCreateVisible(false)
          await reload()
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 16,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  balanceCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  balanceLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  balanceValue: {
    color: '#F9FAFB',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  balanceHint: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 6,
  },
  createButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    color: '#022C22',
    fontSize: 14,
    fontWeight: '700',
  },
  listContainer: {
    flex: 1,
    marginTop: 8,
  },
  sectionTitle: {
    color: '#E5E7EB',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  loadingInlineContainer: {
    marginTop: 24,
  },
  emptyContainer: {
    marginTop: 32,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  emptyTitle: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  scrollContent: {
    paddingVertical: 8,
    paddingBottom: 24,
    gap: 12,
  },
})