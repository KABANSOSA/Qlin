'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { api } from '@/lib/api'
import { CrmShell } from '@/components/crm-shell'
import { CrmAccessBarrier } from '@/components/crm-access-barrier'
import { useCrmAccess } from '@/lib/use-crm-access'
import { Users, ClipboardList, Kanban, CreditCard, TrendingUp } from 'lucide-react'

interface Stats {
  customers: number
  orders_total: number
  by_status: Record<string, number>
  revenue_paid_rub: number
}

export default function CrmDashboardPage() {
  const { loading, user, error, retry } = useCrmAccess()

  const { data: stats, refetch, isFetching } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data } = await api.get<Stats>('/admin/stats')
      return data
    },
    enabled: !!user,
    staleTime: 20_000,
  })

  if (loading || error || !user) {
    return <CrmAccessBarrier loading={loading} user={user} error={error} retry={retry} />
  }

  const pending = stats?.by_status?.pending ?? 0

  return (
    <CrmShell mePhone={user.phone} onRefresh={() => refetch()} isFetching={isFetching}>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-xl font-bold tracking-tight">Обзор</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Лиды и сделки = заявки на уборку. Контакты = клиенты с сайта.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Users className="h-4 w-4" />
              Клиенты
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">{stats?.customers ?? '—'}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <ClipboardList className="h-4 w-4" />
              Всего заявок
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">{stats?.orders_total ?? '—'}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Выручка (оплачено)
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">
              {stats != null
                ? `${Math.round(stats.revenue_paid_rub).toLocaleString('ru-RU')} ₽`
                : '—'}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Kanban className="h-4 w-4" />
              Новых (ожидают)
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">{pending}</p>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/orders"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <ClipboardList className="h-8 w-8 text-primary" />
            <div>
              <div className="font-semibold">Заявки</div>
              <div className="text-xs text-muted-foreground">Список и фильтр по статусу</div>
            </div>
          </Link>
          <Link
            href="/pipeline"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <Kanban className="h-8 w-8 text-primary" />
            <div>
              <div className="font-semibold">Воронка</div>
              <div className="text-xs text-muted-foreground">Статусы заказов по колонкам</div>
            </div>
          </Link>
          <Link
            href="/contacts"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <Users className="h-8 w-8 text-primary" />
            <div>
              <div className="font-semibold">Контакты</div>
              <div className="text-xs text-muted-foreground">Клиенты и число заказов</div>
            </div>
          </Link>
          <Link
            href="/payments"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <CreditCard className="h-8 w-8 text-primary" />
            <div>
              <div className="font-semibold">Оплаты</div>
              <div className="text-xs text-muted-foreground">Заказы и записи платежей</div>
            </div>
          </Link>
        </div>
      </main>
    </CrmShell>
  )
}
