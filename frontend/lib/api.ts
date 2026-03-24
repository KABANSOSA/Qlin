import axios from 'axios'

/**
 * Локальная разработка: бэкенд на localhost:8000.
 * Прод в браузере: абсолютный URL того же origin (nginx → бэкенд), без localhost из бандла.
 */
function getApiBaseURL(): string {
  if (typeof window !== 'undefined') {
    const h = window.location.hostname
    if (h !== 'localhost' && h !== '127.0.0.1') {
      return `${window.location.origin}/api/v1`
    }
  }
  const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')
  return `${base}/api/v1`
}

function getApiOrigin(): string {
  if (typeof window !== 'undefined') {
    const h = window.location.hostname
    if (h !== 'localhost' && h !== '127.0.0.1') {
      return ''
    }
  }
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')
}

export const api = axios.create({
  baseURL: getApiBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * В проде подставляем полный https://домен/api/v1/... — иначе axios иногда оставляет
 * baseURL из сборки (localhost) и запрос уходит в никуда → Network Error на всех устройствах.
 */
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const h = window.location.hostname
    if (h !== 'localhost' && h !== '127.0.0.1') {
      const u = config.url || ''
      const path = u.startsWith('/') ? u : `/${u}`
      config.baseURL = ''
      config.url = `${window.location.origin}/api/v1${path}`
    }
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const origin = getApiOrigin()
          const refreshUrl = origin
            ? `${origin}/api/v1/auth/refresh`
            : `${typeof window !== 'undefined' ? window.location.origin : ''}/api/v1/auth/refresh`
          const response = await axios.post(refreshUrl, {
            refresh_token: refreshToken,
          })

          const { access_token, refresh_token } = response.data
          localStorage.setItem('access_token', access_token)
          localStorage.setItem('refresh_token', refresh_token)

          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/auth/login'
        }
      }
    }

    return Promise.reject(error)
  },
)
