'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { api } from '@/lib/api'
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
  const { loading, user, error, retry } = useCrmAccess()
  const [assignOrder, setAssignOrder] = useState<AssignOrderMinimal | null>(null)

  const {
    data: orders,
    refetch,
    isFetching,
    isLoading,
    isError: ordersError,
  } = useQuery({
    queryKey: ['admin-orders-pipeline', user?.id],
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

  if (loading || error || !user) {
    return <CrmAccessBarrier loading={loading} user={user} error={error} retry={retry} />
  }

  return (
    <CrmShell mePhone={user.phone} onRefresh={() => refetch()} isFetching={isFetching}>
      <main className="mx-auto max-w-[1600px] px-4 py-8">
        <h1 className="text-xl font-bold tracking-tight">Воронка</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Переносите этапы через поле «Этап» на карточке (с подтверждением). Из «Новый» в «Назначен» удобнее кнопкой{' '}
          <strong>Назначить клинера</strong> — так же на странице <strong>Заявки</strong>. Недоступные переходы API
          отклонит с пояснением.
        </p>

        {ordersError && (
          <div className="mt-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
            <span>Не удалось загрузить воронку.</span>
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
                      <div className="mt-2">
                        <OrderStageSelect orderId={o.id} status={o.status} compact />
                      </div>
                      {col.key === 'pending' && o.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() =>
                            setAssignOrder({
                              id: o.id,
                              order_number: o.order_number,
                              address: o.address,
                            })
                          }
                          className="mt-2 w-full rounded-lg bg-primary py-1.5 text-[11px] font-semibold text-primary-foreground hover:opacity-95"
                        >
                          Назначить клинера
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <AssignCleanerModal
        order={assignOrder}
        userId={user?.id}
        onClose={() => setAssignOrder(null)}
        onAssigned={() => {
          refetch()
        }}
      />
    </CrmShell>
  )
}
