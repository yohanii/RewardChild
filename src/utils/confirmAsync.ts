// src/utils/confirmAsync.ts
import { Alert, Platform } from 'react-native'

export const confirmAsync = (title: string, message?: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      const ok = window.confirm(`${title}${message ? `\n${message}` : ''}`)
      resolve(ok)
    } else {
      Alert.alert(title, message, [
        { text: '취소', style: 'cancel', onPress: () => resolve(false) },
        { text: '확인', onPress: () => resolve(true) },
      ])
    }
  })
}
