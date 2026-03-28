'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { LogOut, RefreshCw, ClipboardList } from 'lucide-react'

interface Me {
  id: string
  phone: string
  email?: string
  role: string
}

interface CrmOrder {
  id: string
  order_number: string
  address: string
  cleaning_type: string
  scheduled_at: string
  total_price: string
  status: string
  payment_status: string
  customer_phone?: string | null
  customer_email?: string | null
  special_instructions?: string | null
  created_at: string
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Все статусы' },
  { value: 'pending', label: 'Ожидает' },
  { value: 'assigned', label: 'Назначен' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'completed', label: 'Завершён' },
  { value: 'cancelled', label: 'Отменён' },
]

function statusLabel(s: string) {
  const m: Record<string, string> = {
    pending: 'Ожидает',
    assigned: 'Назначен',
    in_progress: 'В работе',
    completed: 'Завершён',
    cancelled: 'Отменён',
    paid: 'Оплачен',
  }
  return m[s] || s
}

function statusClass(s: string) {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-900',
    assigned: 'bg-sky-100 text-sky-900',
    in_progress: 'bg-violet-100 text-violet-900',
    completed: 'bg-emerald-100 text-emerald-900',
    cancelled: 'bg-slate-200 text-slate-700',
  }
  return map[s] || 'bg-slate-100 text-slate-800'
}

export default function CrmHomePage() {
  const router = useRouter()
  const [status, setStatus] = useState('')
  const [boot, setBoot] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('access_token')
    if (!t) {
      router.replace('/login')
      return
    }
    setBoot(false)
  }, [router])

  const { data: me, error: meError } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get<Me>('/auth/me')
      return data
    },
    enabled: !boot,
    retry: false,
  })

  useEffect(() => {
    if (me && me.role !== 'admin') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      router.replace('/login')
    }
  }, [me, router])

  const {
    data: orders,
    isLoading,
    error: ordersError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin-orders', status],
    queryFn: async () => {
      const params = status ? { status } : {}
      const { data } = await api.get<CrmOrder[]>('/admin/orders', { params })
      return data
    },
    enabled: !boot && me?.role === 'admin',
    staleTime: 30_000,
  })

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    router.push('/login')
  }

  if (boot || (!me && !meError)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (meError || me?.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ClipboardList className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <div className="text-sm font-semibold">QLIN CRM</div>
              <div className="text-xs text-muted-foreground">Заявки с сайта</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">{me.phone}</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
              Обновить
            </button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              <LogOut className="h-3.5 w-3.5" />
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold tracking-tight">Заявки</h1>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Статус</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {ordersError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Не удалось загрузить заявки. Проверьте сеть и права администратора.
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : !orders?.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center text-sm text-muted-foreground">
            Нет заявок
          </div>
        ) : (
          <ul className="space-y-4">
            {orders.map((o) => (
              <li
                key={o.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-sm font-semibold text-primary">{o.order_number}</div>
                    <p className="mt-1 max-w-2xl text-sm text-foreground">{o.address}</p>
                    {(o.customer_phone || o.customer_email) && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {o.customer_phone && <span>{o.customer_phone}</span>}
                        {o.customer_phone && o.customer_email && ' · '}
                        {o.customer_email && <span>{o.customer_email}</span>}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', statusClass(o.status))}>
                      {statusLabel(o.status)}
                    </span>
                    <span className="text-sm font-semibold tabular-nums">
                      {Number(o.total_price).toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <span className="font-medium text-foreground/80">Тип</span> — {o.cleaning_type}
                  </div>
                  <div>
                    <span className="font-medium text-foreground/80">Визит</span> —{' '}
                    {format(new Date(o.scheduled_at), 'd MMM yyyy, HH:mm', { locale: ru })}
                  </div>
                  <div>
                    <span className="font-medium text-foreground/80">Создан</span> —{' '}
                    {format(new Date(o.created_at), 'd MMM yyyy, HH:mm', { locale: ru })}
                  </div>
                  <div>
                    <span className="font-medium text-foreground/80">Оплата</span> — {o.payment_status}
                  </div>
                </div>
                {o.special_instructions && (
                  <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-foreground">
                    <span className="font-medium">Комментарий:</span> {o.special_instructions}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
