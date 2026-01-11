// app/(tabs)/bank/index.tsx
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

export default function BankScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>은행</Text>
      <Text style={styles.sub}>부모 전용 화면</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
  },
  title: {
    color: '#E5E7EB',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  sub: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
})