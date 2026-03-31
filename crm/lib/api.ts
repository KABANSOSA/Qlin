import axios from 'axios'

/**
 * База API (домен с бэкендом), без /api/v1.
 * Сборка: NEXT_PUBLIC_API_URL=https://qlin.pro
 * В браузере на *.qlin.pro подставляем qlin.pro, если env пустой или старый образ.
 */
export function resolveApiOrigin(): string {
  if (typeof window !== 'undefined') {
    const h = window.location.hostname.toLowerCase()
    if (h === 'qlin.pro' || h === 'www.qlin.pro' || h.endsWith('.qlin.pro')) {
      return 'https://qlin.pro'
    }
  }
  const u = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const base = u.replace(/\/$/, '')
  // HTTPS page + http:// API from env → mixed content; on qlin hosts use main site API
  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    base.startsWith('http://') &&
    !/localhost|127\.0\.0\.1/.test(base)
  ) {
    const h = window.location.hostname.toLowerCase()
    if (h === 'qlin.pro' || h.endsWith('.qlin.pro')) {
      return 'https://qlin.pro'
    }
  }
  return base
}

export const api = axios.create({
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  config.baseURL = `${resolveApiOrigin()}/api/v1`
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const origin = resolveApiOrigin()
          const res = await axios.post(`${origin}/api/v1/auth/refresh`, {
            refresh_token: refreshToken,
          })
          const { access_token, refresh_token } = res.data
          localStorage.setItem('access_token', access_token)
          localStorage.setItem('refresh_token', refresh_token)
          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        }
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        if (typeof window !== 'undefined') {
          const p = `${window.location.pathname}${window.location.search}`
          const ret = p.startsWith('/login') ? '/' : p
          window.location.href = `/login?returnUrl=${encodeURIComponent(ret)}`
        }
      }
    }
    return Promise.reject(error)
  }
)
