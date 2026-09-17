import { useSettingsScreen } from '@/src/hooks/useSettingsScreen'
import { confirmAsync } from '@/src/utils/confirmAsync'
import { showAlert } from '@/src/utils/alert'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function SettingsScreen() {
  const { profile, relations, loading, blockingRelationId, blockRelation } = useSettingsScreen()

  const handleBlock = async (relationId: number, name: string) => {
    const confirmed = await confirmAsync(
      '가족 연결을 차단할까요?',
      `${name}님과의 연결이 종료되며 앱에서 직접 복구할 수 없습니다.`,
    )
    if (!confirmed) return

    const blocked = await blockRelation(relationId)
    if (blocked) showAlert('연결을 차단했습니다.')
    else showAlert('차단 실패', '잠시 후 다시 시도해 주세요.')
  }

  if (loading && !profile) {
    return <View style={styles.loadingContainer}><ActivityIndicator color="#2563EB" /></View>
  }
  if (!profile) return null

  const isParent = profile.role === 'PARENT'
  const relationCountCopy = relations.length === 0
    ? '현재 ACTIVE 상태인 가족 연결이 없습니다.'
    : relations.length === 1
      ? '가족 1명과 ACTIVE 상태로 연결되어 있어요.'
      : `가족 ${relations.length}명과 ACTIVE 상태로 연결되어 있어요.`

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Pressable style={styles.iconButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="뒤로 가기">
              <Ionicons name="chevron-back" size={24} color="#1E293B" />
            </Pressable>
            <Text style={styles.title}>설정</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.profileCard}>
            <View style={styles.avatar}><Ionicons name="person" size={25} color="#2563EB" /></View>
            <View style={styles.profileCopy}>
              <Text style={styles.nickname}>{profile.nickname}</Text>
              <Text style={styles.tag}>#{profile.tag}</Text>
            </View>
            <View style={styles.roleBadge}><Text style={styles.roleText}>{isParent ? '부모' : '자녀'}</Text></View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>가족 연결</Text>
              <Text style={styles.activeCount}>ACTIVE {relations.length}</Text>
            </View>
            <Text style={styles.sectionDescription}>{relationCountCopy}</Text>

            {relations.length > 1 && (
              <View style={styles.noticeCard}>
                <Ionicons name="information-circle-outline" size={20} color="#1D4ED8" />
                <Text style={styles.noticeText}>여러 관계 중 하나를 자동 선택하지 않습니다. 각 연결을 개별적으로 확인해 주세요.</Text>
              </View>
            )}

            {relations.map((relation) => {
              const relationRole = isParent ? '자녀' : '부모'
              const displayName = relation.relatedNickname ?? `연결된 ${relationRole}`
              const detail = relation.relatedNickname && relation.relatedTag
                ? `${relationRole} · ${relation.relatedNickname}#${relation.relatedTag}`
                : `${relationRole} · 관계 #${relation.id} · 프로필 정보 비공개`
              const isBlocking = blockingRelationId === relation.id

              return (
                <View key={relation.id} style={styles.relationCard}>
                  <View style={styles.relationTopRow}>
                    <View style={styles.relationIcon}><Ionicons name="people-outline" size={21} color="#0F766E" /></View>
                    <View style={styles.relationCopy}>
                      <Text style={styles.relationName}>{displayName}</Text>
                      <Text style={styles.relationDetail}>{detail}</Text>
                    </View>
                    <View style={styles.activeBadge}><Text style={styles.activeText}>ACTIVE</Text></View>
                  </View>
                  <Pressable
                    style={({ pressed }) => [styles.blockButton, pressed && styles.pressed]}
                    onPress={() => handleBlock(relation.id, displayName)}
                    disabled={blockingRelationId !== null}
                    accessibilityRole="button"
                  >
                    {isBlocking
                      ? <ActivityIndicator size="small" color="#B91C1C" />
                      : <Text style={styles.blockButtonText}>관계 종료 및 차단</Text>}
                  </Pressable>
                </View>
              )
            })}

            {relations.length === 0 && (
              <Pressable
                style={styles.manageButton}
                onPress={() => router.push(isParent ? '/relation/connect' : '/relation/requests')}
                accessibilityRole="button"
              >
                <Ionicons name="link-outline" size={20} color="#FFFFFF" />
                <Text style={styles.manageButtonText}>{isParent ? '가족 연결 시작하기' : '연결 요청 확인하기'}</Text>
              </Pressable>
            )}

            {relations.length > 0 && !isParent && (
              <Pressable style={styles.requestsButton} onPress={() => router.push('/relation/requests')} accessibilityRole="button">
                <Text style={styles.requestsButtonText}>새 연결 요청 확인</Text>
                <Ionicons name="chevron-forward" size={18} color="#2563EB" />
              </Pressable>
            )}
          </View>

          <Pressable style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]} onPress={() => router.push('/logout')} accessibilityRole="button">
            <Ionicons name="log-out-outline" size={20} color="#B91C1C" />
            <Text style={styles.logoutText}>로그아웃</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F7FB' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 36 },
  content: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: 22 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F7FB' },
  header: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  title: { color: '#0F172A', fontSize: 20, fontWeight: '800' },
  headerSpacer: { width: 42 },
  profileCard: { padding: 18, borderRadius: 22, flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: '#FFFFFF' },
  avatar: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF' },
  profileCopy: { flex: 1 },
  nickname: { color: '#1E293B', fontSize: 18, fontWeight: '800' },
  tag: { color: '#64748B', fontSize: 13, fontWeight: '600', marginTop: 3 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: '#E0EAFF' },
  roleText: { color: '#1D4ED8', fontSize: 12, fontWeight: '700' },
  section: { gap: 11 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: '#334155', fontSize: 16, fontWeight: '800' },
  activeCount: { color: '#047857', fontSize: 11, fontWeight: '800' },
  sectionDescription: { color: '#64748B', fontSize: 13, lineHeight: 19 },
  noticeCard: { padding: 13, borderRadius: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 9, backgroundColor: '#EFF6FF' },
  noticeText: { flex: 1, color: '#1E40AF', fontSize: 12, lineHeight: 18 },
  relationCard: { padding: 17, borderRadius: 20, gap: 14, backgroundColor: '#FFFFFF' },
  relationTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  relationIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECFDF5' },
  relationCopy: { flex: 1 },
  relationName: { color: '#1E293B', fontSize: 15, fontWeight: '700' },
  relationDetail: { color: '#64748B', fontSize: 11, marginTop: 4 },
  activeBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: '#D1FAE5' },
  activeText: { color: '#047857', fontSize: 10, fontWeight: '800' },
  blockButton: { minHeight: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2' },
  blockButtonText: { color: '#B91C1C', fontSize: 13, fontWeight: '700' },
  manageButton: { minHeight: 50, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2563EB' },
  manageButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  requestsButton: { padding: 15, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF' },
  requestsButtonText: { color: '#2563EB', fontSize: 14, fontWeight: '700' },
  logoutButton: { minHeight: 52, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFFFFF' },
  logoutText: { color: '#B91C1C', fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.72 },
})
