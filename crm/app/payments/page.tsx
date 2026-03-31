'use client'

import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { api } from '@/lib/api'
import { CrmShell } from '@/components/crm-shell'
import { CrmAccessBarrier } from '@/components/crm-access-barrier'
import { useCrmAccess } from '@/lib/use-crm-access'

interface OrderRow {
  id: string
  order_number: string
  total_price: string
  payment_status: string
  payment_method?: string | null
  customer_phone?: string | null
  customer_email?: string | null
  created_at: string
}

interface PaymentRow {
  id: string
  order_number: string
  amount: number
  currency: string
  status: string
  payment_method: string
  provider_payment_id?: string | null
  created_at?: string | null
  customer_phone?: string | null
  customer_email?: string | null
}

export default function CrmPaymentsPage() {
  const { loading, user, error, retry } = useCrmAccess()

  const {
    data: orders,
    refetch: refetchOrders,
    isFetching: f1,
    isLoading: l1,
    isError: errOrders,
  } = useQuery({
    queryKey: ['admin-orders-pay', user?.id],
    queryFn: async () => {
      const { data } = await api.get<OrderRow[]>('/admin/orders', { params: { limit: 100 } })
      return data
    },
    enabled: !!user,
    staleTime: 20_000,
  })

  const {
    data: payments,
    refetch: refetchPay,
    isFetching: f2,
    isLoading: l2,
    isError: errPayments,
  } = useQuery({
    queryKey: ['admin-payments', user?.id],
    queryFn: async () => {
      const { data } = await api.get<PaymentRow[]>('/admin/payments', { params: { limit: 100 } })
      return data
    },
    enabled: !!user,
    staleTime: 20_000,
  })

  const refetch = () => {
    refetchOrders()
    refetchPay()
  }
  const isFetching = f1 || f2
  const isLoading = l1 || l2

  if (loading || error || !user) {
    return <CrmAccessBarrier loading={loading} user={user} error={error} retry={retry} />
  }

  const pendingSum =
    orders?.filter((o) => o.payment_status === 'pending').reduce((s, o) => s + Number(o.total_price || 0), 0) ?? 0
  const paidSum =
    orders?.filter((o) => o.payment_status === 'paid').reduce((s, o) => s + Number(o.total_price || 0), 0) ?? 0

  return (
    <CrmShell mePhone={user.phone} onRefresh={refetch} isFetching={isFetching}>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-xl font-bold tracking-tight">Оплаты</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Суммы по заказам (поле оплаты в заказе) и записи из платёжной таблицы, если они есть.
        </p>

        {(errOrders || errPayments) && (
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
            <span>Часть данных не загрузилась.</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-red-900 ring-1 ring-red-200 hover:bg-red-100"
            >
              Обновить всё
            </button>
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-xs font-medium uppercase text-muted-foreground">К оплате по заказам</div>
            <p className="mt-2 text-2xl font-bold tabular-nums">{Math.round(pendingSum).toLocaleString('ru-RU')} ₽</p>
            <p className="mt-1 text-xs text-muted-foreground">Заказы со статусом оплаты pending</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-xs font-medium uppercase text-muted-foreground">Оплачено по заказам</div>
            <p className="mt-2 text-2xl font-bold tabular-nums">{Math.round(paidSum).toLocaleString('ru-RU')} ₽</p>
            <p className="mt-1 text-xs text-muted-foreground">Заказы со статусом оплаты paid</p>
          </div>
        </div>

        <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Заказы и оплата
        </h2>
        {isLoading ? (
          <div className="mt-4 h-40 animate-pulse rounded-2xl bg-muted" />
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Заказ</th>
                  <th className="px-4 py-3 font-medium">Сумма</th>
                  <th className="px-4 py-3 font-medium">Оплата</th>
                  <th className="px-4 py-3 font-medium">Способ</th>
                  <th className="px-4 py-3 font-medium">Клиент</th>
                  <th className="px-4 py-3 font-medium">Создан</th>
                </tr>
              </thead>
              <tbody>
                {(orders ?? []).map((o) => (
                  <tr key={o.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3 font-mono tabular-nums">{o.order_number}</td>
                    <td className="px-4 py-3 tabular-nums">{Number(o.total_price).toLocaleString('ru-RU')} ₽</td>
                    <td className="px-4 py-3">{o.payment_status}</td>
                    <td className="px-4 py-3 text-xs">{o.payment_method || '—'}</td>
                    <td className="px-4 py-3 text-xs">
                      {o.customer_phone || o.customer_email || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {format(new Date(o.created_at), 'd MMM yyyy HH:mm', { locale: ru })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Провайдерские платежи
        </h2>
        {!payments?.length ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Записей в таблице payments нет — после подключения эквайринга здесь появятся транзакции.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Заказ</th>
                  <th className="px-4 py-3 font-medium">Сумма</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                  <th className="px-4 py-3 font-medium">Метод</th>
                  <th className="px-4 py-3 font-medium">Клиент</th>
                  <th className="px-4 py-3 font-medium">Дата</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3 font-mono">{p.order_number}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {p.amount.toLocaleString('ru-RU')} {p.currency}
                    </td>
                    <td className="px-4 py-3">{p.status}</td>
                    <td className="px-4 py-3">{p.payment_method}</td>
                    <td className="px-4 py-3 text-xs">
                      {p.customer_phone || p.customer_email || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {p.created_at
                        ? format(new Date(p.created_at), 'd MMM yyyy HH:mm', { locale: ru })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </CrmShell>
  )
}
