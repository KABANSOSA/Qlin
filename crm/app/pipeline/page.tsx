'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Phone, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { CrmShell } from '@/components/crm-shell'
import { CrmAccessBarrier } from '@/components/crm-access-barrier'
import { useCrmAccess } from '@/lib/use-crm-access'
import { AssignCleanerModal, type AssignOrderMinimal } from '@/components/assign-cleaner-modal'
import { OrderStageSelect } from '@/components/order-stage-select'

interface CrmOrder {
  id: string
  order_number: string
  address: string
  total_price: string
  status: string
  payment_status: string
  customer_phone?: string | null
  cleaner_name?: string | null
  scheduled_at: string
}

const COLUMNS: { key: string; label: string; color: string }[] = [
  { key: 'pending',     label: 'Новый',    color: 'border-amber-300 bg-amber-50/50' },
  { key: 'assigned',   label: 'Назначен',  color: 'border-sky-300 bg-sky-50/50' },
  { key: 'in_progress',label: 'В работе',  color: 'border-violet-300 bg-violet-50/50' },
  { key: 'completed',  label: 'Завершён',  color: 'border-emerald-300 bg-emerald-50/50' },
  { key: 'cancelled',  label: 'Отменён',   color: 'border-slate-200 bg-slate-50/50' },
]

const STATUS_DOT: Record<string, string> = {
  pending: 'bg-amber-400',
  assigned: 'bg-sky-400',
  in_progress: 'bg-violet-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-slate-400',
}

export default function CrmPipelinePage() {
  const { loading, user, error, retry } = useCrmAccess()
  const [assignOrder, setAssignOrder] = useState<AssignOrderMinimal | null>(null)

  const { data: orders = [], refetch, isFetching, isLoading, isError: ordersError } = useQuery({
    queryKey: ['admin-orders-pipeline', user?.id],
    queryFn: async () => {
      const { data } = await api.get<CrmOrder[]>('/admin/orders', { params: { limit: 200 } })
      return data
    },
    enabled: !!user,
    staleTime: 20_000,
  })

  const grouped = useMemo(() => {
    const g: Record<string, CrmOrder[]> = {}
    for (const col of COLUMNS) g[col.key] = []
    for (const o of orders) {
      const k = COLUMNS.some(c => c.key === o.status) ? o.status : 'pending'
      g[k].push(o)
    }
    return g
  }, [orders])

  if (loading || error || !user) {
    return <CrmAccessBarrier loading={loading} user={user} error={error} retry={retry} />
  }

  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total_price), 0)

  return (
    <CrmShell mePhone={user.phone} onRefresh={() => refetch()} isFetching={isFetching}>
      <main className="flex h-full min-h-0 flex-col overflow-hidden px-4 py-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Воронка заявок</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {orders.length} заявок · Выручка:{' '}
              <span className="font-medium text-foreground">{totalRevenue.toLocaleString('ru-RU')} ₽</span>
            </p>
          </div>
        </div>

        {ordersError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Не удалось загрузить воронку.{' '}
            <button type="button" onClick={() => refetch()} className="font-medium underline">Повторить</button>
          </div>
        )}

        {isLoading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-muted" />
        ) : (
          <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-3">
            {COLUMNS.map(col => {
              const colOrders = grouped[col.key] ?? []
              const colTotal = colOrders.reduce((s, o) => s + Number(o.total_price), 0)
              return (
                <div
                  key={col.key}
                  className={cn(
                    'flex w-[240px] shrink-0 flex-col rounded-xl border-t-2 bg-white shadow-sm',
                    col.color,
                  )}
                >
                  {/* Column header */}
                  <div className="flex items-center justify-between border-b border-border/60 px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('h-2 w-2 rounded-full', STATUS_DOT[col.key])} />
                      <span className="text-xs font-semibold text-foreground">{col.label}</span>
                      <span className="ml-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {colOrders.length}
                      </span>
                    </div>
                    {colTotal > 0 && (
                      <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                        {colTotal.toLocaleString('ru-RU')} ₽
                      </span>
                    )}
                  </div>

                  {/* Cards */}
                  <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
                    {colOrders.length === 0 && (
                      <p className="py-6 text-center text-xs text-muted-foreground/60">Пусто</p>
                    )}
                    {colOrders.map(o => (
                      <div
                        key={o.id}
                        className="rounded-lg border border-border bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-mono text-[11px] font-bold text-primary">{o.order_number}</span>
                          <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                            {format(new Date(o.scheduled_at), 'd MMM', { locale: ru })}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[11px] text-foreground">{o.address}</p>

                        {(o.customer_phone || o.cleaner_name) && (
                          <div className="mt-2 space-y-1">
                            {o.customer_phone && (
                              <a
                                href={`tel:${o.customer_phone}`}
                                className="flex items-center gap-1 text-[10px] text-primary hover:underline"
                                onClick={e => e.stopPropagation()}
                              >
                                <Phone className="h-2.5 w-2.5 shrink-0" />
                                <span className="tabular-nums">{o.customer_phone}</span>
                              </a>
                            )}
                            {o.cleaner_name && (
                              <p className="text-[10px] text-muted-foreground">👤 {o.cleaner_name}</p>
                            )}
                          </div>
                        )}

                        <div className="mt-2 flex items-center justify-between gap-1">
                          <span className="text-[11px] font-semibold tabular-nums text-foreground">
                            {Number(o.total_price).toLocaleString('ru-RU')} ₽
                          </span>
                          <span className={cn(
                            'rounded-full px-1.5 py-0.5 text-[9px] font-medium',
                            o.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
                          )}>
                            {o.payment_status === 'paid' ? 'Оплачен' : 'Не оплачен'}
                          </span>
                        </div>

                        <div className="mt-2">
                          <OrderStageSelect orderId={o.id} status={o.status} compact />
                        </div>

                        {col.key === 'pending' && o.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => setAssignOrder({ id: o.id, order_number: o.order_number, address: o.address })}
                            className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-primary py-1.5 text-[11px] font-semibold text-primary-foreground hover:opacity-90"
                          >
                            <Sparkles className="h-3 w-3" />
                            Назначить
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
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
