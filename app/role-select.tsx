import { router } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { supabase } from '../src/services/supabaseClient'
import { showAlert } from '../src/utils/alert'

export default function RoleSelectScreen() {
  const [selecting, setSelecting] = useState(false)

  const handleSelectRole = async (role: 'PARENT' | 'CHILD') => {
    if (selecting) return

    setSelecting(true)
    const { error } = await supabase.rpc('select_user_role', { p_role: role })
    setSelecting(false)

    if (error) {
      showAlert('역할 선택 실패', error.message)
      return
    }
    router.replace('/relation/connect')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>당신의 역할을 선택하세요</Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#6C63FF' }]}
        onPress={() => handleSelectRole('PARENT')}
        disabled={selecting}>
        <Text style={styles.text}>부모로 시작하기</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#FF9F1C' }]}
        onPress={() => handleSelectRole('CHILD')}
        disabled={selecting}>
        <Text style={styles.text}>자녀로 시작하기</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 40 },
  button: {
    width: '100%',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  text: { color: '#fff', fontWeight: '600', textAlign: 'center' },
})
