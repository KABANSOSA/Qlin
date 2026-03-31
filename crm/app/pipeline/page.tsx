'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { api } from '@/lib/api'
import { CrmShell } from '@/components/crm-shell'
import { CrmAccessBarrier } from '@/components/crm-access-barrier'
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
  cleaner_id?: string | null
}

interface CleanerRow {
  user_id: string
  phone: string
  first_name: string
  is_available: boolean
  rating: number | null
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
  const [assignOrder, setAssignOrder] = useState<CrmOrder | null>(null)
  const [pickCleanerId, setPickCleanerId] = useState('')
  const [assignErr, setAssignErr] = useState<string | null>(null)

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

  const { data: cleaners = [] } = useQuery({
    queryKey: ['admin-cleaners', user?.id],
    queryFn: async () => {
      const { data } = await api.get<CleanerRow[]>('/admin/cleaners')
      return data
    },
    enabled: !!user,
    staleTime: 60_000,
  })

  const assignMutation = useMutation({
    mutationFn: async ({ orderId, cleanerId }: { orderId: string; cleanerId: string }) => {
      await api.post(`/admin/orders/${orderId}/assign`, { cleaner_id: cleanerId })
    },
    onSuccess: () => {
      setAssignOrder(null)
      setPickCleanerId('')
      setAssignErr(null)
      refetch()
    },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { detail?: unknown } } }
      const d = ax.response?.data?.detail
      setAssignErr(typeof d === 'string' ? d : 'Не удалось назначить исполнителя')
    },
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

  const openAssign = (o: CrmOrder) => {
    setAssignErr(null)
    setPickCleanerId('')
    setAssignOrder(o)
  }

  const submitAssign = () => {
    if (!assignOrder) return
    if (!pickCleanerId) {
      setAssignErr('Выберите исполнителя из списка')
      return
    }
    setAssignErr(null)
    assignMutation.mutate({ orderId: assignOrder.id, cleanerId: pickCleanerId })
  }

  if (loading || error || !user) {
    return <CrmAccessBarrier loading={loading} user={user} error={error} retry={retry} />
  }

  return (
    <CrmShell mePhone={user.phone} onRefresh={() => refetch()} isFetching={isFetching}>
      <main className="mx-auto max-w-[1600px] px-4 py-8">
        <h1 className="text-xl font-bold tracking-tight">Воронка</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Новые заявки попадают в колонку «Новый». Менеджер назначает уборщика — заказ переходит в «Назначен»; дальше
          статусы «В работе» / «Завершён» выставляются по мере готовности процессов (API/бот).
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
                      {col.key === 'pending' && o.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => openAssign(o)}
                          className="mt-2 w-full rounded-lg bg-primary py-1.5 text-[11px] font-semibold text-primary-foreground hover:opacity-95"
                        >
                          Назначить исполнителя
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

      {assignOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="assign-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl">
            <h2 id="assign-title" className="text-base font-semibold">
              Назначить исполнителя
            </h2>
            <p className="mt-1 text-xs text-muted-foreground font-mono">{assignOrder.order_number}</p>
            <p className="mt-2 text-sm text-foreground line-clamp-2">{assignOrder.address}</p>

            {cleaners.length === 0 ? (
              <p className="mt-4 text-sm text-amber-800">
                Нет уборщиков с профилем в системе. Создайте пользователя с ролью cleaner и запись в таблице{' '}
                <code className="rounded bg-muted px-1">cleaners</code>.
              </p>
            ) : (
              <label className="mt-4 block text-sm font-medium">
                Исполнитель
                <select
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={pickCleanerId}
                  onChange={(e) => setPickCleanerId(e.target.value)}
                >
                  <option value="">— выберите —</option>
                  {cleaners.map((c) => (
                    <option key={c.user_id} value={c.user_id}>
                      {c.first_name ? `${c.first_name} · ` : ''}
                      {c.phone}
                      {!c.is_available ? ' (занят)' : ''}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {assignErr && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {assignErr}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm ring-1 ring-border hover:bg-muted"
                onClick={() => {
                  setAssignOrder(null)
                  setAssignErr(null)
                }}
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={assignMutation.isPending || cleaners.length === 0}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-50"
                onClick={submitAssign}
              >
                {assignMutation.isPending ? 'Сохранение…' : 'Назначить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </CrmShell>
  )
}
