import { useEffect, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'

function resolveExpoProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined
  const fromExtra = extra?.eas?.projectId
  const fromEas = Constants.easConfig as { projectId?: string } | null
  const fromEnv = process.env.EXPO_PUBLIC_EAS_PROJECT_ID
  return fromExtra ?? fromEas?.projectId ?? fromEnv ?? undefined
}

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
 * После входа запрашивает разрешение, получает Expo Push token и шлёт на POST /users/push-token.
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
        const projectId = resolveExpoProjectId()
        const token = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined,
        )
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[push] Expo token:', token.data, projectId ? `(projectId ok)` : '(no projectId)')
        }
        const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : null
        if (!platform) return

        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
        for (let attempt = 0; attempt < 3; attempt++) {
          if (cancelled) return
          try {
            await api.post('/users/push-token', { token: token.data, platform })
            registered.current = true
            break
          } catch (err) {
            if (__DEV__) {
              // eslint-disable-next-line no-console
              console.warn(`[push] push-token attempt ${attempt + 1}/3:`, err)
            }
            if (attempt < 2) await sleep(600 * (attempt + 1))
          }
        }
      } catch (e) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn(
            '[push] getExpoPushTokenAsync failed — для production укажите EAS projectId (eas init / extra.eas.projectId или EXPO_PUBLIC_EAS_PROJECT_ID):',
            e,
          )
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user])
}
