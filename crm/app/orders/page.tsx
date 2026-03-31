'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'
import { CrmShell } from '@/components/crm-shell'
import { CrmAccessBarrier } from '@/components/crm-access-barrier'
import { useCrmAccess } from '@/lib/use-crm-access'
import { getPublicOrderUrl } from '@/lib/public-site'
import { AssignCleanerModal, type AssignOrderMinimal } from '@/components/assign-cleaner-modal'

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
  cleaner_id?: string | null
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

export default function CrmOrdersPage() {
  const { loading, user, error, retry } = useCrmAccess()
  const [status, setStatus] = useState('')
  const [assignOrder, setAssignOrder] = useState<AssignOrderMinimal | null>(null)

  const {
    data: orders,
    isLoading,
    error: ordersError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin-orders', user?.id, status],
    queryFn: async () => {
      const params: Record<string, string> = { limit: '100' }
      if (status) params.status = status
      const { data } = await api.get<CrmOrder[]>('/admin/orders', { params })
      return data
    },
    enabled: !!user,
    staleTime: 30_000,
  })

  if (loading || error || !user) {
    return <CrmAccessBarrier loading={loading} user={user} error={error} retry={retry} />
  }

  return (
    <CrmShell mePhone={user.phone} onRefresh={() => refetch()} isFetching={isFetching}>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Заявки</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Для статуса «Ожидает» назначьте клинера — заказ перейдёт в «Назначен».
            </p>
          </div>
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
          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
            <span>Не удалось загрузить заявки.</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-red-900 ring-1 ring-red-200 hover:bg-red-100"
            >
              Повторить
            </button>
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
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <a
                    href={getPublicOrderUrl(o.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    Открыть на сайте
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                  {o.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() =>
                        setAssignOrder({
                          id: o.id,
                          order_number: o.order_number,
                          address: o.address,
                        })
                      }
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-95"
                    >
                      Назначить клинера
                    </button>
                  )}
                  {o.cleaner_id && o.status !== 'pending' && (
                    <span className="text-xs text-muted-foreground">
                      Исполнитель: <span className="font-mono text-foreground">{o.cleaner_id.slice(0, 8)}…</span>
                    </span>
                  )}
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

      <AssignCleanerModal
        order={assignOrder}
        userId={user?.id}
        onClose={() => setAssignOrder(null)}
        onAssigned={() => refetch()}
      />
    </CrmShell>
  )
}
