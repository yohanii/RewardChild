// app/(tabs)/bank/index.tsx
import { ScreenHeader } from '@/src/components/common/ScreenHeader'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function BankScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <ScreenHeader title="은행" subtitle="가족의 재화 흐름을 확인하고 관리해요." />
        <View style={styles.card}>
          <View style={styles.icon}><Ionicons name="card-outline" size={25} color="#2563EB" /></View>
          <Text style={styles.title}>은행 기능을 준비하고 있어요</Text>
          <Text style={styles.sub}>추후 부모 전용 재화 관리 기능이 이곳에 추가됩니다.</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F7FB' },
  container: { flex: 1, width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 16, gap: 22 },
  card: { padding: 24, borderRadius: 22, alignItems: 'center', backgroundColor: '#FFFFFF', marginTop: 8 },
  icon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF', marginBottom: 16 },
  title: {
    color: '#1E293B',
    fontSize: 17,
    fontWeight: '700',
  },
  sub: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    textAlign: 'center',
  },
})
