import { router } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { supabase } from '../src/services/supabaseClient'

export default function RoleSelectScreen() {
  const handleSelectRole = async (role: 'PARENT' | 'CHILD') => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('users').update({ role }).eq('auth_user_id', user.id)
    router.replace('/relation/connect')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>당신의 역할을 선택하세요</Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#6C63FF' }]}
        onPress={() => handleSelectRole('PARENT')}>
        <Text style={styles.text}>부모로 시작하기</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#FF9F1C' }]}
        onPress={() => handleSelectRole('CHILD')}>
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
