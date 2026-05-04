'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Search,
  Sparkles,
  User2,
  X,
} from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { CrmShell } from '@/components/crm-shell'
import { CrmAccessBarrier } from '@/components/crm-access-barrier'
import { useCrmAccess } from '@/lib/use-crm-access'
import { getPublicOrderUrl } from '@/lib/public-site'
import { AssignCleanerModal, type AssignOrderMinimal } from '@/components/assign-cleaner-modal'
import { OrderStageSelect } from '@/components/order-stage-select'

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
  cleaner_phone?: string | null
  cleaner_name?: string | null
  cleaner_payout?: string | null
  supply_cost?: string | null
  other_cost?: string | null
  margin_rub?: string | null
  margin_pct?: number | null
}

interface CrmOrderComment {
  id: string
  order_id?: string | null
  author_phone?: string | null
  body: string
  created_at: string
}

interface CrmOrderTask {
  id: string
  title: string
  status: string
  deadline?: string | null
  order_id?: string | null
  creator_phone?: string | null
  created_at: string
}

const STATUS_TABS = [
  { value: '', label: 'Все' },
  { value: 'pending', label: 'Ожидает' },
  { value: 'assigned', label: 'Назначен' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'completed', label: 'Завершён' },
  { value: 'cancelled', label: 'Отменён' },
]

const STATUS_LABEL: Record<string, string> = {
  pending: 'Ожидает',
  assigned: 'Назначен',
  in_progress: 'В работе',
  completed: 'Завершён',
  cancelled: 'Отменён',
}

const STATUS_CLASS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  assigned: 'bg-sky-100 text-sky-800',
  in_progress: 'bg-violet-100 text-violet-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-slate-100 text-slate-600',
}

const PAY_LABEL: Record<string, string> = {
  pending: 'Не оплачен',
  paid: 'Оплачен',
  refunded: 'Возврат',
}

const TASK_LABEL: Record<string, string> = {
  todo: 'Новая',
  in_progress: 'В работе',
  done: 'Готово',
  cancelled: 'Отменена',
}

const TASK_CLASS: Record<string, string> = {
  todo: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-violet-100 text-violet-800',
  done: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-slate-100 text-slate-600',
}

function marginColor(pct: number | null | undefined): string {
  if (pct == null) return 'text-muted-foreground'
  if (pct >= 35) return 'text-emerald-600 font-semibold'
  if (pct >= 20) return 'text-amber-600'
  return 'text-red-600'
}

export default function CrmOrdersPage() {
  const { loading, user, error, retry } = useCrmAccess()
  const qc = useQueryClient()

  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detailTab, setDetailTab] = useState<'actions' | 'notes' | 'finance'>('actions')
  const [assignOrder, setAssignOrder] = useState<AssignOrderMinimal | null>(null)
  const [commentText, setCommentText] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDeadline, setTaskDeadline] = useState('')
  const [financeMarginPct, setFinanceMarginPct] = useState('10')
  const [financeSupplyCost, setFinanceSupplyCost] = useState('0')
  const [financeOtherCost, setFinanceOtherCost] = useState('0')

  const { data: orders = [], isLoading, error: ordersError, refetch, isFetching } = useQuery({
    queryKey: ['admin-orders', user?.id, statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = { limit: '200' }
      if (statusFilter) params.status = statusFilter
      const { data } = await api.get<CrmOrder[]>('/admin/orders', { params })
      return data
    },
    enabled: !!user,
    staleTime: 30_000,
  })

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDetailId(null)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    const detail = detailId ? orders.find(o => o.id === detailId) ?? null : null
    if (!detail) return
    setFinanceMarginPct(String(detail.margin_pct ?? 10))
    setFinanceSupplyCost(String(detail.supply_cost ?? 0))
    setFinanceOtherCost(String(detail.other_cost ?? 0))
  }, [detailId, orders])

  const counts = useMemo(
    () =>
      STATUS_TABS.reduce<Record<string, number>>((acc, t) => {
        acc[t.value] =
          t.value === '' ? orders.length : orders.filter(o => o.status === t.value).length
        return acc
      }, {}),
    [orders],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return orders
    return orders.filter(o =>
      [o.order_number, o.address, o.customer_phone, o.customer_email, o.cleaner_name, o.cleaner_phone]
        .filter(Boolean).join(' ').toLowerCase().includes(q)
    )
  }, [orders, search])

  const detail = detailId ? orders.find(o => o.id === detailId) ?? null : null

  const commentsQuery = useQuery({
    queryKey: ['admin-order-comments', detailId],
    queryFn: async () => {
      const { data } = await api.get<CrmOrderComment[]>(`/admin/crm/orders/${detailId}/comments`)
      return data
    },
    enabled: !!user && !!detailId,
  })

  const tasksQuery = useQuery({
    queryKey: ['admin-order-tasks', detailId],
    queryFn: async () => {
      const { data } = await api.get<CrmOrderTask[]>(`/admin/crm/orders/${detailId}/tasks`)
      return data
    },
    enabled: !!user && !!detailId,
  })

  const addComment = useMutation({
    mutationFn: async () => {
      const body = commentText.trim()
      if (!detailId || !body) return
      await api.post(`/admin/crm/orders/${detailId}/comments`, { body })
    },
    onSuccess: () => {
      setCommentText('')
      qc.invalidateQueries({ queryKey: ['admin-order-comments', detailId] })
    },
  })

  const addTask = useMutation({
    mutationFn: async () => {
      const title = taskTitle.trim()
      if (!detailId || !title) return
      await api.post(`/admin/crm/orders/${detailId}/tasks`, {
        title,
        deadline: taskDeadline ? new Date(taskDeadline).toISOString() : undefined,
      })
    },
    onSuccess: () => {
      setTaskTitle('')
      setTaskDeadline('')
      qc.invalidateQueries({ queryKey: ['admin-order-tasks', detailId] })
    },
  })

  const updateTaskStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/admin/crm/tasks/${id}`, { status })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-order-tasks', detailId] })
    },
  })

  const updateFinance = useMutation({
    mutationFn: async () => {
      if (!detailId) return
      await api.patch(`/admin/orders/${detailId}/costs`, {
        margin_pct: Number(financeMarginPct || 0),
        supply_cost: Number(financeSupplyCost || 0),
        other_cost: Number(financeOtherCost || 0),
      })
    },
    onSuccess: () => {
      refetch()
    },
  })

  if (loading || error || !user) {
    return <CrmAccessBarrier loading={loading} user={user} error={error} retry={retry} />
  }

  return (
    <CrmShell mePhone={user.phone} onRefresh={() => refetch()} isFetching={isFetching}>
      <main className="mx-auto max-w-[1600px] px-4 py-6">
        <div className="mb-4">
          <h1 className="text-lg font-bold tracking-tight text-foreground">Заявки</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Для «Ожидает» назначьте клинера — заказ перейдёт в «Назначен».
          </p>
        </div>

        {/* Status tabs */}
        <div className="mb-3 flex flex-wrap items-center gap-1 border-b border-border bg-white px-1 py-2">
          {STATUS_TABS.map(t => (
            <button
              key={t.value || 'all'}
              type="button"
              onClick={() => setStatusFilter(t.value)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                statusFilter === t.value
                  ? 'bg-brand/10 text-brand'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {t.label}
              {counts[t.value] > 0 && (
                <span className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                  statusFilter === t.value ? 'bg-brand text-white' : 'bg-muted text-muted-foreground',
                  t.value === 'pending' && counts[t.value] > 0 && statusFilter !== 'pending' ? 'bg-amber-500 text-white' : '',
                )}>
                  {counts[t.value]}
                </span>
              )}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Поиск по №, адресу, телефону…"
                className="h-8 w-56 rounded-md border border-border bg-[#f5f6f8] pl-8 pr-3 text-xs focus:border-brand focus:outline-none"
              />
            </div>
          </div>
        </div>

        {ordersError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Не удалось загрузить заявки.{' '}
            <button type="button" onClick={() => refetch()} className="font-medium underline">Повторить</button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-border bg-white shadow-sm">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[1,2,3,4,5].map(i => <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16">
              <p className="text-sm text-muted-foreground">{search ? 'Ничего не найдено' : 'Заявок нет'}</p>
            </div>
          ) : (
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-[#fafbfc] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5">Статус</th>
                  <th className="px-3 py-2.5">Номер</th>
                  <th className="px-3 py-2.5">Визит</th>
                  <th className="px-3 py-2.5">Адрес</th>
                  <th className="px-3 py-2.5">Клиент</th>
                  <th className="px-3 py-2.5">Клинер</th>
                  <th className="px-3 py-2.5 text-right">Сумма</th>
                  <th className="px-3 py-2.5 text-right">Маржа</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr
                    key={o.id}
                    onClick={() => { setDetailId(o.id); setDetailTab('actions') }}
                    className={cn(
                      'cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-blue-50/40',
                      detailId === o.id && 'bg-blue-50',
                    )}
                  >
                    <td className="px-4 py-2.5">
                      <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', STATUS_CLASS[o.status] || 'bg-slate-100 text-slate-700')}>
                        {STATUS_LABEL[o.status] || o.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs font-semibold text-primary">
                      {o.order_number}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">
                      {format(new Date(o.scheduled_at), 'd MMM, HH:mm', { locale: ru })}
                    </td>
                    <td className="max-w-[200px] px-3 py-2.5 text-xs">
                      <span className="line-clamp-1">{o.address}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-xs">
                      {o.customer_phone
                        ? <a href={`tel:${o.customer_phone}`} onClick={e => e.stopPropagation()} className="text-primary hover:underline tabular-nums">{o.customer_phone}</a>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {o.cleaner_name || o.cleaner_phone
                        ? <span>{o.cleaner_name || o.cleaner_phone}</span>
                        : o.status === 'pending'
                          ? <button type="button" onClick={e => { e.stopPropagation(); setAssignOrder({ id: o.id, order_number: o.order_number, address: o.address }) }} className="rounded-md bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground hover:opacity-90">Назначить</button>
                          : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right text-sm font-semibold tabular-nums">
                      {Number(o.total_price).toLocaleString('ru-RU')} ₽
                    </td>
                    <td className={cn('whitespace-nowrap px-3 py-2.5 text-right text-xs tabular-nums', marginColor(o.margin_pct))}>
                      {o.margin_pct != null ? `${o.margin_pct}%` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <a
                        href={getPublicOrderUrl(o.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-primary"
                        title="Открыть на сайте"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* ── DETAIL SLIDE-OVER ── */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setDetailId(null)}>
          <div
            className="flex h-full w-full max-w-[820px] flex-col bg-white shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center gap-3 border-b border-border px-5 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                #
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Заявка</p>
                <h2 className="font-mono text-base font-bold text-primary">{detail.order_number}</h2>
              </div>
              <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', STATUS_CLASS[detail.status] || 'bg-slate-100')}>
                {STATUS_LABEL[detail.status] || detail.status}
              </span>
              <a href={getPublicOrderUrl(detail.id)} target="_blank" rel="noopener noreferrer" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" title="На сайте">
                <ExternalLink className="h-4 w-4" />
              </a>
              <button type="button" onClick={() => setDetailId(null)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex min-h-0 flex-1 overflow-hidden">
              {/* Left sidebar */}
              <div className="flex w-60 shrink-0 flex-col gap-4 overflow-y-auto border-r border-border bg-[#fafbfc] p-4 text-sm">
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Объект</p>
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="text-xs">{detail.address}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{detail.cleaning_type}</p>
                </div>

                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Визит</p>
                  <p className="text-xs font-medium">{format(new Date(detail.scheduled_at), 'd MMMM yyyy', { locale: ru })}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(detail.scheduled_at), 'HH:mm', { locale: ru })}</p>
                </div>

                {(detail.customer_phone || detail.customer_email) && (
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Клиент</p>
                    <div className="space-y-1.5">
                      {detail.customer_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <a href={`tel:${detail.customer_phone}`} className="text-xs text-primary hover:underline tabular-nums">{detail.customer_phone}</a>
                        </div>
                      )}
                      {detail.customer_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <a href={`mailto:${detail.customer_email}`} className="truncate text-xs text-primary hover:underline">{detail.customer_email}</a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {detail.cleaner_id && (
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Клинер</p>
                    <div className="flex items-center gap-2">
                      <User2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="text-xs">{detail.cleaner_name || '—'}</span>
                    </div>
                    {detail.cleaner_phone && (
                      <div className="mt-1 flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <a href={`tel:${detail.cleaner_phone}`} className="text-xs text-primary hover:underline tabular-nums">{detail.cleaner_phone}</a>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Оплата</p>
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium',
                    detail.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
                  )}>
                    {PAY_LABEL[detail.payment_status] || detail.payment_status}
                  </span>
                </div>

                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Создан</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(detail.created_at), 'd MMM yyyy, HH:mm', { locale: ru })}</p>
                </div>

                {detail.special_instructions && (
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Инструкции</p>
                    <p className="whitespace-pre-wrap text-xs text-foreground">{detail.special_instructions}</p>
                  </div>
                )}
              </div>

              {/* Right */}
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Tabs */}
                <div className="flex shrink-0 border-b border-border bg-white px-4">
                  {(['actions', 'notes', 'finance'] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setDetailTab(tab)}
                      className={cn(
                        'border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                        detailTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {tab === 'actions' ? 'Действия' : tab === 'notes' ? 'Комментарии и задачи' : 'Финансы'}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                  {detailTab === 'actions' && (
                    <div className="flex flex-col gap-5">
                      <div>
                        <p className="mb-2 text-xs font-semibold text-muted-foreground">Изменить статус</p>
                        <OrderStageSelect orderId={detail.id} status={detail.status} />
                      </div>

                      {!detail.cleaner_id || detail.status === 'pending' ? (
                        <div>
                          <p className="mb-2 text-xs font-semibold text-muted-foreground">Клинер</p>
                          <button
                            type="button"
                            onClick={() => setAssignOrder({ id: detail.id, order_number: detail.order_number, address: detail.address })}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                          >
                            <Sparkles className="h-4 w-4" />
                            Назначить клинера
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="mb-1 text-xs font-semibold text-muted-foreground">Текущий клинер</p>
                          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
                            <p className="font-medium">{detail.cleaner_name || '—'}</p>
                            {detail.cleaner_phone && <p className="text-xs text-muted-foreground">{detail.cleaner_phone}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => setAssignOrder({ id: detail.id, order_number: detail.order_number, address: detail.address })}
                            className="mt-2 text-xs text-muted-foreground hover:text-foreground hover:underline"
                          >
                            Сменить клинера
                          </button>
                        </div>
                      )}

                      <div>
                        <p className="mb-2 text-xs font-semibold text-muted-foreground">Ссылки</p>
                        <a
                          href={getPublicOrderUrl(detail.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Открыть страницу заказа
                        </a>
                      </div>
                    </div>
                  )}

                  {detailTab === 'notes' && (
                    <div className="grid gap-5 xl:grid-cols-2">
                      <section className="rounded-xl border border-border bg-card p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-sm font-semibold">Комментарии</h3>
                          <span className="text-xs text-muted-foreground">{commentsQuery.data?.length ?? 0}</span>
                        </div>
                        <div className="space-y-3">
                          <textarea
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            placeholder="Напишите комментарий по заказу..."
                            rows={4}
                            className="w-full resize-none rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                          />
                          <button
                            type="button"
                            disabled={!commentText.trim() || addComment.isPending}
                            onClick={() => addComment.mutate()}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                          >
                            {addComment.isPending ? 'Сохранение...' : 'Добавить комментарий'}
                          </button>
                        </div>
                        <div className="mt-5 space-y-3">
                          {commentsQuery.isLoading ? (
                            <p className="text-sm text-muted-foreground">Загрузка комментариев...</p>
                          ) : commentsQuery.data?.length ? (
                            commentsQuery.data.map(c => (
                              <div key={c.id} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                                <div className="mb-1 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                                  <span>{c.author_phone || 'Администратор'}</span>
                                  <span>{format(new Date(c.created_at), 'd MMM, HH:mm', { locale: ru })}</span>
                                </div>
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{c.body}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">Комментариев пока нет.</p>
                          )}
                        </div>
                      </section>

                      <section className="rounded-xl border border-border bg-card p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-sm font-semibold">Задачи</h3>
                          <span className="text-xs text-muted-foreground">{tasksQuery.data?.length ?? 0}</span>
                        </div>
                        <div className="space-y-3">
                          <input
                            value={taskTitle}
                            onChange={e => setTaskTitle(e.target.value)}
                            placeholder="Например: позвонить клиенту"
                            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary"
                          />
                          <input
                            type="datetime-local"
                            value={taskDeadline}
                            onChange={e => setTaskDeadline(e.target.value)}
                            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary"
                          />
                          <button
                            type="button"
                            disabled={!taskTitle.trim() || addTask.isPending}
                            onClick={() => addTask.mutate()}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                          >
                            {addTask.isPending ? 'Создание...' : 'Создать задачу'}
                          </button>
                        </div>
                        <div className="mt-5 space-y-3">
                          {tasksQuery.isLoading ? (
                            <p className="text-sm text-muted-foreground">Загрузка задач...</p>
                          ) : tasksQuery.data?.length ? (
                            tasksQuery.data.map(t => (
                              <div key={t.id} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-medium">{t.title}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {t.deadline
                                        ? `Дедлайн: ${format(new Date(t.deadline), 'd MMM, HH:mm', { locale: ru })}`
                                        : 'Без дедлайна'}
                                    </p>
                                  </div>
                                  <select
                                    value={t.status}
                                    disabled={updateTaskStatus.isPending}
                                    onChange={e => updateTaskStatus.mutate({ id: t.id, status: e.target.value })}
                                    className={cn('rounded-md border border-border px-2 py-1 text-xs', TASK_CLASS[t.status] || 'bg-white')}
                                  >
                                    <option value="todo">{TASK_LABEL.todo}</option>
                                    <option value="in_progress">{TASK_LABEL.in_progress}</option>
                                    <option value="done">{TASK_LABEL.done}</option>
                                    <option value="cancelled">{TASK_LABEL.cancelled}</option>
                                  </select>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">Задач пока нет.</p>
                          )}
                        </div>
                      </section>
                    </div>
                  )}

                  {detailTab === 'finance' && (
                    <div className="flex flex-col gap-3">
                      <div className="rounded-xl border border-border bg-card p-4">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Расчёт</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Выручка</span>
                            <span className="font-semibold tabular-nums">{Number(detail.total_price).toLocaleString('ru-RU')} ₽</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Выплата клинеру</span>
                            <span className="tabular-nums">{detail.cleaner_payout != null ? `${Number(detail.cleaner_payout).toLocaleString('ru-RU')} ₽` : '—'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Расходники</span>
                            <span className="tabular-nums">{detail.supply_cost != null ? `${Number(detail.supply_cost).toLocaleString('ru-RU')} ₽` : '0 ₽'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Прочее</span>
                            <span className="tabular-nums">{detail.other_cost != null ? `${Number(detail.other_cost).toLocaleString('ru-RU')} ₽` : '0 ₽'}</span>
                          </div>
                          <div className="mt-2 flex justify-between border-t border-border pt-2">
                            <span className="font-semibold">Маржа</span>
                            <span className={cn('tabular-nums', marginColor(detail.margin_pct))}>
                              {detail.margin_rub != null ? `${Number(detail.margin_rub).toLocaleString('ru-RU')} ₽` : '—'}
                              {detail.margin_pct != null && <span className="ml-1 text-xs">({detail.margin_pct}%)</span>}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-xl border border-border bg-card p-4">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ручная маржа</p>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <label className="text-xs text-muted-foreground">
                            Маржа, %
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.1}
                              value={financeMarginPct}
                              onChange={e => setFinanceMarginPct(e.target.value)}
                              className="mt-1 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary"
                            />
                          </label>
                          <label className="text-xs text-muted-foreground">
                            Расходники, ₽
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={financeSupplyCost}
                              onChange={e => setFinanceSupplyCost(e.target.value)}
                              className="mt-1 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary"
                            />
                          </label>
                          <label className="text-xs text-muted-foreground">
                            Прочее, ₽
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={financeOtherCost}
                              onChange={e => setFinanceOtherCost(e.target.value)}
                              className="mt-1 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary"
                            />
                          </label>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          По умолчанию для новых заказов маржа 10%. При сохранении CRM пересчитает выплату клинеру.
                        </p>
                        <button
                          type="button"
                          disabled={updateFinance.isPending}
                          onClick={() => updateFinance.mutate()}
                          className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                        >
                          {updateFinance.isPending ? 'Сохранение...' : 'Сохранить маржу'}
                        </button>
                      </div>
                      <div className="rounded-xl border border-border bg-card p-4">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Статус оплаты</p>
                        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium',
                          detail.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
                        )}>
                          {PAY_LABEL[detail.payment_status] || detail.payment_status}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <AssignCleanerModal
        order={assignOrder}
        userId={user?.id}
        onClose={() => setAssignOrder(null)}
        onAssigned={() => {
          refetch()
          qc.invalidateQueries({ queryKey: ['admin-orders-pipeline'] })
        }}
      />
    </CrmShell>
  )
}
