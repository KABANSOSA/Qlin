'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { getPublicSiteUrl } from '@/lib/public-site'

function safeReturnPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/'
  if (raw.includes('..')) return '/'
  return raw
}

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [afterLogin, setAfterLogin] = useState('/')

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setAfterLogin(safeReturnPath(p.get('returnUrl')))
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { phone, password })
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      const me = await api.get('/auth/me')
      if (me.data.role !== 'admin') {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        setError('Доступ только для администратора (роль admin).')
        return
      }
      router.push(afterLogin)
      router.refresh()
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && !err.response) {
        setError(
          'Нет ответа от API. Проверьте CORS на бэкенде (origin этой страницы в CORS_ORIGINS) или откройте CRM по домену (например crm.qlin.pro).'
        )
        return
      }
      const ax = err as { response?: { data?: { detail?: string | unknown } } }
      const d = ax.response?.data?.detail
      setError(typeof d === 'string' ? d : 'Неверный телефон или пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200 px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="text-2xl font-bold tracking-tight text-primary">QLIN</div>
          <p className="mt-1 text-sm text-muted-foreground">CRM — вход для администраторов</p>
          <p className="mt-3 text-left text-xs leading-relaxed text-muted-foreground">
            Нужна учётная запись с ролью <strong className="text-foreground">admin</strong> в базе (аккаунт
            клиента с сайта сюда не пускается). Телефон вводите как в базе, чаще с{' '}
            <strong className="text-foreground">+7</strong>.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Телефон или email</label>
            <input
              type="text"
              autoComplete="username"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={cn(
                'w-full rounded-lg border border-border px-3 py-2.5 text-sm',
                'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
              )}
              placeholder="+79991234567"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Пароль</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(
                'w-full rounded-lg border border-border px-3 py-2.5 text-sm',
                'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
              )}
              required
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-destructive">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
          >
            {loading ? 'Вход…' : 'Войти'}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Отдельное приложение от публичного сайта.{' '}
          <Link href={getPublicSiteUrl()} className="text-primary underline">
            qlin.pro
          </Link>
        </p>
      </div>
    </div>
  )
}
