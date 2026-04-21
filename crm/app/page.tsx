'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  AlertCircle,
  BarChart3,
  Briefcase,
  CalendarDays,
  CheckSquare2,
  ClipboardList,
  CreditCard,
  Kanban,
  Percent,
  PiggyBank,
  TrendingUp,
  Users,
} from 'lucide-react'
import { api } from '@/lib/api'
import { CrmShell } from '@/components/crm-shell'
import { CrmAccessBarrier } from '@/components/crm-access-barrier'
import { useCrmAccess } from '@/lib/use-crm-access'
import { STAGE_LABEL } from '@/lib/crm-sales-config'
import { cn } from '@/lib/utils'

interface Stats {
  customers: number
  cleaners: number
  orders_total: number
  by_status: Record<string, number>
  revenue_paid_rub: number
  orders_today: number
  orders_this_week: number
  orders_this_month: number
  revenue_this_week_rub: number
  revenue_this_month_rub: number
  avg_order_value_rub: number
  total_margin_rub: number
  total_margin_pct: number
  month_margin_rub: number
  month_margin_pct: number
  total_payout_rub: number
}

interface Opp {
  id: string
  kind: string
  stage: string
  title: string
  estimated_value_rub: string | null
  created_at: string
}

interface Task {
  id: string
  title: string
  status: string
  deadline: string | null
  opportunity_title: string | null
  assigned_to_phone: string | null
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  href,
  alert,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
  sub?: string
  href?: string
  alert?: boolean
}) {
  const inner = (
    <div
      className={cn(
        'rounded-2xl border bg-card p-5 shadow-sm transition-shadow',
        href && 'hover:shadow-md',
        alert ? 'border-red-200 bg-red-50' : 'border-border',
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2 text-xs font-medium uppercase tracking-wide',
          alert ? 'text-red-600' : 'text-muted-foreground',
        )}
      >
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className={cn('mt-2 text-2xl font-bold tabular-nums', alert && 'text-red-700')}>{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

export default function CrmDashboardPage() {
  const { loading, user, error, retry } = useCrmAccess()

  const { data: stats, refetch, isFetching, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ['admin-stats', user?.id],
    queryFn: async () => {
      const { data } = await api.get<Stats>('/admin/stats')
      return data
    },
    enabled: !!user,
    staleTime: 20_000,
  })

  const { data: leads = [] } = useQuery({
    queryKey: ['crm-leads-dash'],
    queryFn: () => api.get<Opp[]>('/admin/crm/opportunities', { params: { kind: 'lead' } }).then(r => r.data),
    enabled: !!user,
    staleTime: 30_000,
  })

  const { data: deals = [] } = useQuery({
    queryKey: ['crm-deals-dash'],
    queryFn: () => api.get<Opp[]>('/admin/crm/opportunities', { params: { kind: 'deal' } }).then(r => r.data),
    enabled: !!user,
    staleTime: 30_000,
  })

  const { data: allTasks = [] } = useQuery({
    queryKey: ['crm-tasks-dash'],
    queryFn: () => api.get<Task[]>('/admin/crm/tasks').then(r => r.data),
    enabled: !!user,
    staleTime: 30_000,
  })

  if (loading || error || !user) {
    return <CrmAccessBarrier loading={loading} user={user} error={error} retry={retry} />
  }

  const pending = stats?.by_status?.pending ?? 0

  const now = new Date()
  const overdueTasks = allTasks.filter(
    t => t.deadline && t.status !== 'done' && t.status !== 'cancelled' && new Date(t.deadline) < now,
  )
  const activeTasks = allTasks.filter(t => t.status !== 'done' && t.status !== 'cancelled')
  const newLeads = leads.filter(l => l.stage === 'new')
  const dealPipelineValue = deals.reduce((s, d) => s + (Number(d.estimated_value_rub) || 0), 0)

  // Group leads by stage for mini-funnel
  const leadsByStage = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.stage] = (acc[l.stage] || 0) + 1
    return acc
  }, {})

  return (
    <CrmShell mePhone={user.phone} onRefresh={() => refetch()} isFetching={isFetching}>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Обзор</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {format(new Date(), 'EEEE, d MMMM yyyy', { locale: ru })}
            </p>
          </div>
        </div>

        {statsError && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1">Не удалось загрузить статистику.</span>
            <button type="button" onClick={() => refetch()} className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium ring-1 ring-red-200 hover:bg-red-100">
              Повторить
            </button>
          </div>
        )}

        {/* ── ЗАЯВКИ (основные метрики) ── */}
        <h2 className="mt-8 mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Заявки на уборку</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Клиенты" value={statsLoading ? '…' : stats?.customers ?? '—'} sub={`Клинеров: ${stats?.cleaners ?? 0}`} href="/contacts" />
          <StatCard icon={ClipboardList} label="Всего заявок" value={statsLoading ? '…' : stats?.orders_total ?? '—'} sub={`Сегодня: ${stats?.orders_today ?? 0}`} href="/orders" />
          <StatCard icon={Kanban} label="Ожидают назначения" value={statsLoading ? '…' : pending} sub={`Средний чек: ${stats ? Math.round(stats.avg_order_value_rub).toLocaleString('ru-RU') + ' ₽' : '—'}`} href="/pipeline" alert={pending > 0} />
          <StatCard icon={TrendingUp} label="Выручка (оплачено)" value={statsLoading ? '…' : stats ? `${Math.round(stats.revenue_paid_rub).toLocaleString('ru-RU')} ₽` : '—'} sub={`За неделю: ${stats ? Math.round(stats.revenue_this_week_rub).toLocaleString('ru-RU') + ' ₽' : '—'}`} />
        </div>

        <div className="mt-3 grid gap-4 sm:grid-cols-4">
          <StatCard icon={CalendarDays} label="За неделю" value={`${statsLoading ? '…' : stats?.orders_this_week ?? 0} заявок`} />
          <StatCard icon={Briefcase} label="За месяц" value={`${statsLoading ? '…' : stats?.orders_this_month ?? 0} заявок`} />
          <StatCard icon={BarChart3} label="Выручка за месяц" value={statsLoading ? '…' : stats ? `${Math.round(stats.revenue_this_month_rub).toLocaleString('ru-RU')} ₽` : '—'} />
          <StatCard icon={PiggyBank} label="Маржа за месяц" value={statsLoading ? '…' : stats ? `${Math.round(stats.month_margin_rub).toLocaleString('ru-RU')} ₽` : '—'} sub={stats ? `${stats.month_margin_pct}% от выручки` : ''} />
        </div>

        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={PiggyBank} label="Маржа (всего)" value={statsLoading ? '…' : stats ? `${Math.round(stats.total_margin_rub).toLocaleString('ru-RU')} ₽` : '—'} sub={stats ? `${stats.total_margin_pct}% от выручки` : ''} />
          <StatCard icon={Percent} label="Выплаты клинерам" value={statsLoading ? '…' : stats ? `${Math.round(stats.total_payout_rub).toLocaleString('ru-RU')} ₽` : '—'} />
          <StatCard icon={BarChart3} label="Средний чек" value={statsLoading ? '…' : stats ? `${Math.round(stats.avg_order_value_rub).toLocaleString('ru-RU')} ₽` : '—'} />
          <Link href="/payments" className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-muted-foreground" />
            <div>
              <div className="font-semibold text-sm">Оплаты</div>
              <div className="text-xs text-muted-foreground mt-0.5">Детали транзакций</div>
            </div>
          </Link>
        </div>

        {/* ── CRM ── */}
        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">CRM: Лиды и сделки</h2>
          <Link href="/sales" className="text-xs font-medium text-primary hover:underline">Открыть лиды →</Link>
        </div>

        {/* Просроченные задачи — алерт */}
        {overdueTasks.length > 0 && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-red-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {overdueTasks.length} просроченных {overdueTasks.length === 1 ? 'задача' : overdueTasks.length < 5 ? 'задачи' : 'задач'}
            </div>
            <ul className="mt-2 space-y-1">
              {overdueTasks.slice(0, 4).map(t => (
                <li key={t.id} className="flex items-center gap-2 text-xs text-red-700">
                  <span className="font-medium truncate">{t.title}</span>
                  {t.deadline && (
                    <span className="shrink-0 tabular-nums">
                      {format(new Date(t.deadline), 'd MMM в HH:mm', { locale: ru })}
                    </span>
                  )}
                  {t.opportunity_title && (
                    <span className="shrink-0 text-red-500">· {t.opportunity_title}</span>
                  )}
                </li>
              ))}
              {overdueTasks.length > 4 && (
                <li className="text-xs text-red-500">ещё {overdueTasks.length - 4}…</li>
              )}
            </ul>
            <Link href="/tasks" className="mt-2 inline-flex text-xs font-semibold text-red-700 hover:underline">
              Перейти к задачам →
            </Link>
          </div>
        )}

        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={TrendingUp}
            label="Новых лидов"
            value={newLeads.length}
            sub={leads.length > 0 ? `Всего: ${leads.length}` : 'Нет лидов'}
            href="/sales"
            alert={newLeads.length > 0}
          />
          <StatCard
            icon={Briefcase}
            label="Активных сделок"
            value={deals.filter(d => d.stage !== 'won' && d.stage !== 'lost').length}
            sub={dealPipelineValue > 0 ? `Потенциал: ${Math.round(dealPipelineValue).toLocaleString('ru-RU')} ₽` : 'Нет суммы'}
            href="/sales"
          />
          <StatCard
            icon={CheckSquare2}
            label="Активных задач"
            value={activeTasks.length}
            sub={overdueTasks.length > 0 ? `Просрочено: ${overdueTasks.length}` : 'Нет просроченных'}
            href="/tasks"
            alert={overdueTasks.length > 0}
          />
          <StatCard
            icon={CreditCard}
            label="Выиграно сделок"
            value={deals.filter(d => d.stage === 'won').length}
            sub={`Проиграно: ${deals.filter(d => d.stage === 'lost').length}`}
            href="/sales"
          />
        </div>

        {/* Воронка лидов */}
        {leads.length > 0 && (
          <div className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Воронка лидов</span>
              <Link href="/sales" className="text-xs font-medium text-primary hover:underline">Все лиды</Link>
            </div>
            <div className="flex flex-wrap gap-3">
              {['new', 'contacted', 'qualified', 'lost'].map(stage => {
                const count = leadsByStage[stage] || 0
                if (!count) return null
                const colors: Record<string, string> = {
                  new: 'bg-slate-100 text-slate-700',
                  contacted: 'bg-blue-100 text-blue-700',
                  qualified: 'bg-emerald-100 text-emerald-700',
                  lost: 'bg-red-100 text-red-700',
                }
                return (
                  <div key={stage} className={cn('flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium', colors[stage] || 'bg-slate-100 text-slate-700')}>
                    <span>{STAGE_LABEL[stage] || stage}</span>
                    <span className="font-bold">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Свежие лиды */}
        {leads.length > 0 && (
          <div className="mt-4 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <span className="text-sm font-semibold text-foreground">Последние лиды</span>
              <Link href="/sales" className="text-xs font-medium text-primary hover:underline">Смотреть все</Link>
            </div>
            <ul className="divide-y divide-border">
              {[...leads]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5)
                .map(l => (
                  <li key={l.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                      {l.title.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{l.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {format(new Date(l.created_at), 'd MMM, HH:mm', { locale: ru })}
                      </p>
                    </div>
                    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      l.stage === 'new' ? 'bg-slate-100 text-slate-700' :
                      l.stage === 'contacted' ? 'bg-blue-100 text-blue-700' :
                      l.stage === 'qualified' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-red-100 text-red-700'
                    )}>
                      {STAGE_LABEL[l.stage] || l.stage}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* Быстрые ссылки */}
        <h2 className="mt-8 mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Разделы</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/orders" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
            <ClipboardList className="h-7 w-7 text-primary" />
            <div>
              <div className="font-semibold text-sm">Заявки</div>
              <div className="text-xs text-muted-foreground mt-0.5">Список и фильтр</div>
            </div>
          </Link>
          <Link href="/pipeline" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
            <Kanban className="h-7 w-7 text-primary" />
            <div>
              <div className="font-semibold text-sm">Воронка</div>
              <div className="text-xs text-muted-foreground mt-0.5">Kanban по статусам</div>
            </div>
          </Link>
          <Link href="/sales" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
            <TrendingUp className="h-7 w-7 text-primary" />
            <div>
              <div className="font-semibold text-sm">Лиды и сделки</div>
              <div className="text-xs text-muted-foreground mt-0.5">CRM воронка продаж</div>
            </div>
          </Link>
          <Link href="/tasks" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
            <CheckSquare2 className="h-7 w-7 text-primary" />
            <div>
              <div className="font-semibold text-sm">Задачи</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {activeTasks.length > 0 ? `${activeTasks.length} активных` : 'Нет активных'}
              </div>
            </div>
          </Link>
        </div>
      </main>
    </CrmShell>
  )
}
