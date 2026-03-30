'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { api } from '@/lib/api'
import { CrmShell } from '@/components/crm-shell'
import { useCrmAccess } from '@/lib/use-crm-access'

interface CrmOrder {
  id: string
  order_number: string
  address: string
  total_price: string
  status: string
  payment_status: string
  customer_phone?: string | null
  scheduled_at: string
}

const COLUMNS: { key: string; label: string }[] = [
  { key: 'pending', label: 'Новый' },
  { key: 'assigned', label: 'Назначен' },
  { key: 'in_progress', label: 'В работе' },
  { key: 'completed', label: 'Завершён' },
  { key: 'cancelled', label: 'Отменён' },
]

export default function CrmPipelinePage() {
  const { loading, user } = useCrmAccess()

  const { data: orders, refetch, isFetching, isLoading } = useQuery({
    queryKey: ['admin-orders-pipeline'],
    queryFn: async () => {
      const { data } = await api.get<CrmOrder[]>('/admin/orders', { params: { limit: 100 } })
      return data
    },
    enabled: !!user,
    staleTime: 20_000,
  })

  const grouped = useMemo(() => {
    const g: Record<string, CrmOrder[]> = {}
    for (const col of COLUMNS) g[col.key] = []
    for (const o of orders ?? []) {
      const k = COLUMNS.some((c) => c.key === o.status) ? o.status : 'pending'
      if (!g[k]) g[k] = []
      g[k].push(o)
    }
    return g
  }, [orders])

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <CrmShell mePhone={user.phone} onRefresh={() => refetch()} isFetching={isFetching}>
      <main className="mx-auto max-w-[1600px] px-4 py-8">
        <h1 className="text-xl font-bold tracking-tight">Воронка</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Сделки = заявки на уборку. Перетаскивание между колонками позже можно добавить через смену статуса в API.
        </p>

        {isLoading ? (
          <div className="mt-8 h-64 animate-pulse rounded-2xl bg-muted" />
        ) : (
          <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
            {COLUMNS.map((col) => (
              <div
                key={col.key}
                className="flex w-[260px] shrink-0 flex-col rounded-2xl border border-border bg-muted/30 p-4"
              >
                <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {col.label}{' '}
                  <span className="text-foreground">({grouped[col.key]?.length ?? 0})</span>
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  {(grouped[col.key] ?? []).map((o) => (
                    <div
                      key={o.id}
                      className="rounded-xl border border-border bg-card p-3 text-xs shadow-sm"
                    >
                      <div className="font-mono font-semibold text-primary">{o.order_number}</div>
                      <p className="mt-1 line-clamp-2 text-foreground">{o.address}</p>
                      {o.customer_phone && (
                        <p className="mt-1 text-muted-foreground">{o.customer_phone}</p>
                      )}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="tabular-nums font-medium">
                          {Number(o.total_price).toLocaleString('ru-RU')} ₽
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(o.scheduled_at), 'd MMM', { locale: ru })}
                        </span>
                      </div>
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        Оплата: {o.payment_status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </CrmShell>
  )
}
