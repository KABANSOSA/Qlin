import axios from 'axios'

/** Базовый URL API (домен сайта с бэкендом), без /api/v1. Для CRM на crm.qlin.pro укажите https://qlin.pro */
function apiOrigin(): string {
  const u = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  return u.replace(/\/$/, '')
}

export const api = axios.create({
  baseURL: `${apiOrigin()}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
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
          const res = await axios.post(`${apiOrigin()}/api/v1/auth/refresh`, {
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
        if (typeof window !== 'undefined') window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
