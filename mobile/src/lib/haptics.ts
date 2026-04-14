import * as ExpoHaptics from 'expo-haptics'
import { Platform } from 'react-native'

export async function light(): Promise<void> {
  if (Platform.OS === 'web') return
  try {
    await ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light)
  } catch {
    /* no-op */
  }
}

export async function medium(): Promise<void> {
  if (Platform.OS === 'web') return
  try {
    await ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium)
  } catch {
    /* no-op */
  }
}

export async function success(): Promise<void> {
  if (Platform.OS === 'web') return
  try {
    await ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success)
  } catch {
    /* no-op */
  }
}

export async function warning(): Promise<void> {
  if (Platform.OS === 'web') return
  try {
    await ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Warning)
  } catch {
    /* no-op */
  }
}
