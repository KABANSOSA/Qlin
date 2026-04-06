import { useEffect, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

/**
 * Регистрирует Expo Push token. Отправка токена на бэкенд — отдельный POST (добавьте эндпоинт и вызовите здесь).
 */
export function usePushRegistration() {
  const { user } = useAuth()
  const registered = useRef(false)

  useEffect(() => {
    if (!user) {
      registered.current = false
      return
    }
    if (registered.current) return

    let cancelled = false

    ;(async () => {
      if (!Device.isDevice) return

      const { status: existing } = await Notifications.getPermissionsAsync()
      let finalStatus = existing
      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }
      if (finalStatus !== 'granted' || cancelled) return

      try {
        const projectId =
          (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId
        const token = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined,
        )
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[push] Expo token:', token.data)
        }
        const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : null
        if (platform) {
          try {
            await api.post('/users/push-token', { token: token.data, platform })
          } catch (err) {
            if (__DEV__) {
              // eslint-disable-next-line no-console
              console.warn('[push] не удалось отправить токен на сервер:', err)
            }
          }
        }
        registered.current = true
      } catch (e) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn('[push] registration failed (нужен EAS projectId для production):', e)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user])
}
