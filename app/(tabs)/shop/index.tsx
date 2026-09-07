import { BalanceCard } from '@/src/components/common/BalanceCard'
import { ScreenHeader } from '@/src/components/common/ScreenHeader'
import { ShopItemCard } from '@/src/components/shop/ShopItemCard'
import { ShopItemCreateModal } from '@/src/components/shop/ShopItemCreateModal'
import { useShopScreen } from '@/src/hooks/useShopScreen'
import React, { useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ShopScreen() {
  const { profile, balance, loading, mutating, orderedItems, purchasedSet, createItem, reload } = useShopScreen()
  const [createVisible, setCreateVisible] = useState(false)

  if (loading && !profile) {
    return <View style={styles.loadingContainer}><ActivityIndicator color="#2563EB" /></View>
  }

  const isParent = profile?.role === 'PARENT'

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.content}>
        <ScreenHeader
          title="상점"
          subtitle={isParent ? '아이에게 보여줄 보상을 관리해요.' : '모은 코인으로 받을 보상을 골라 보세요.'}
          actionLabel={isParent ? '아이템 등록' : undefined}
          onAction={isParent ? () => setCreateVisible(true) : undefined}
        />
        <BalanceCard
          label={isParent ? '자녀의 보유 코인' : '사용 가능한 코인'}
          amount={balance}
          caption={isParent ? '연결된 자녀의 현재 재화를 표시하고 있어요.' : undefined}
          compact
        />
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
          <ScrollView style={styles.list} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {orderedItems.map((item) => <ShopItemCard key={item.id} item={item} purchased={purchasedSet.has(item.id)} />)}
          </ScrollView>
        )}
      </View>

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
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F7FB' },
  content: { flex: 1, width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 16, gap: 18 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F7FB' },
  sectionTitle: { color: '#334155', fontSize: 16, fontWeight: '800', marginTop: 2 },
  loadingInline: { paddingTop: 24 },
  emptyContainer: { padding: 20, borderRadius: 20, backgroundColor: '#FFFFFF' },
  emptyTitle: { color: '#1E293B', fontSize: 16, fontWeight: '700' },
  emptySubtitle: { color: '#64748B', fontSize: 13, lineHeight: 19, marginTop: 5 },
  list: { flex: 1, marginHorizontal: -2 },
  scrollContent: { paddingHorizontal: 2, paddingBottom: 28, gap: 12 },
})
