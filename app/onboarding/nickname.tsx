import { router } from 'expo-router'
import { useState } from 'react'
import { Alert, Button, Text, TextInput, View } from 'react-native'
import { supabase } from '../../src/services/supabaseClient'

export default function NicknameScreen() {
  const [nickname, setNickname] = useState('')

  const handleSubmit = async () => {
    if (!nickname.trim()) return Alert.alert('닉네임을 입력해주세요')

    const tag = Math.random().toString(16).substring(2, 6).toUpperCase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('users')
      .update({ nickname, tag })
      .eq('auth_user_id', user.id)

    router.replace('/role-select')
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
        닉네임을 설정하세요
      </Text>
      <TextInput
        placeholder="닉네임 입력"
        value={nickname}
        onChangeText={setNickname}
        style={{
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
          marginBottom: 20,
        }}
      />
      <Button title="다음으로" onPress={handleSubmit} />
    </View>
  )
}
