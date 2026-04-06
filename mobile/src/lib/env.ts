import Constants from 'expo-constants'

/** Базовый URL API, например https://qlin.pro/api/v1 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL
  if (fromEnv && fromEnv.length > 0) return fromEnv.replace(/\/$/, '')
  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined
  if (extra?.apiUrl) return extra.apiUrl.replace(/\/$/, '')
  return 'https://qlin.pro/api/v1'
}
