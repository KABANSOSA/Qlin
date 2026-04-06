import axios, { type InternalAxiosRequestConfig } from 'axios'
import * as SecureStore from 'expo-secure-store'
import { getApiBaseUrl } from './env'

const apiBaseUrl = getApiBaseUrl()

export const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await SecureStore.getItemAsync('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean }

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config as RetryConfig | undefined
    if (!original) throw error
    if (error.response?.status !== 401 || original._retry) throw error
    original._retry = true
    const refresh = await SecureStore.getItemAsync('refresh_token')
    if (!refresh) throw error
    try {
      const { data } = await axios.post<{ access_token: string; refresh_token: string }>(
        `${apiBaseUrl}/auth/refresh`,
        { refresh_token: refresh },
      )
      await SecureStore.setItemAsync('access_token', data.access_token)
      await SecureStore.setItemAsync('refresh_token', data.refresh_token)
      original.headers.Authorization = `Bearer ${data.access_token}`
      return api(original)
    } catch {
      await SecureStore.deleteItemAsync('access_token')
      await SecureStore.deleteItemAsync('refresh_token')
      throw error
    }
  },
)
