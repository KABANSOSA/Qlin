'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CheckCircle2, Circle, Clock, Plus, Trash2, XCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { CrmShell } from '@/components/crm-shell'
import { CrmAccessBarrier } from '@/components/crm-access-barrier'
import { useCrmAccess } from '@/lib/use-crm-access'
import { TASK_STATUS_BADGE, TASK_STATUS_LABEL, TASK_STATUS_ORDER } from '@/lib/crm-sales-config'
import { cn } from '@/lib/utils'

interface CrmTask {
  id: string
  title: string
  status: string
  deadline: string | null
  opportunity_id: string | null
  opportunity_title: string | null
  creator_id: string | null
  creator_phone: string | null
  assigned_to_id: string | null
  assigned_to_phone: string | null
  created_at: string
  updated_at: string
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  todo: <Circle className="h-4 w-4 text-slate-400" />,
  in_progress: <Clock className="h-4 w-4 text-blue-500" />,
  done: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  cancelled: <XCircle className="h-4 w-4 text-red-400" />,
}

export default function CrmTasksPage() {
  const { loading, user, error, retry } = useCrmAccess()
  const qc = useQueryClient()

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [cTitle, setCTitle] = useState('')
  const [cStatus, setCStatus] = useState<string>('todo')
  const [cDeadline, setCDeadline] = useState('')
  const [cOppId, setCOppId] = useState('')
  const [cOppSearch, setCOppSearch] = useState('')
  const [cErr, setCErr] = useState<string | null>(null)

  const { data: opportunities = [] } = useQuery({
    queryKey: ['crm-opps-for-task-modal'],
    queryFn: async () => {
      const [a, b] = await Promise.all([
        api.get<{ id: string; kind: string; title: string }[]>('/admin/crm/opportunities', { params: { kind: 'lead' } }),
        api.get<{ id: string; kind: string; title: string }[]>('/admin/crm/opportunities', { params: { kind: 'deal' } }),
      ])
      return [...a.data, ...b.data]
    },
    enabled: !!user && createOpen,
    staleTime: 60_000,
  })

  const filteredOpps = useMemo(() => {
    const q = cOppSearch.trim().toLowerCase()
    if (!q) return opportunities
    return opportunities.filter(o => o.title.toLowerCase().includes(q))
  }, [opportunities, cOppSearch])

  const { data: tasks = [], refetch, isFetching, isLoading } = useQuery({
    queryKey: ['crm-tasks', statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (statusFilter !== 'all') params.status = statusFilter
      const { data } = await api.get<CrmTask[]>('/admin/crm/tasks', { params })
      return data
    },
    enabled: !!user,
    staleTime: 15_000,
  })

  const createMut = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        title: cTitle.trim(),
        status: cStatus,
      }
      if (cDeadline) body.deadline = new Date(cDeadline).toISOString()
      if (cOppId.trim()) body.opportunity_id = cOppId.trim()
      await api.post('/admin/crm/tasks', body)
    },
    onSuccess: () => {
      setCreateOpen(false)
      setCErr(null)
      setCTitle('')
      setCStatus('todo')
      setCDeadline('')
      setCOppId('')
      setCOppSearch('')
      qc.invalidateQueries({ queryKey: ['crm-tasks'] })
    },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { detail?: string } } }
      setCErr(ax.response?.data?.detail || 'Ошибка сохранения')
    },
  })

  const patchStatusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/admin/crm/tasks/${id}`, { status })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-tasks'] }),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/crm/tasks/${id}`)
    },
    onSuccess: () => {
      setDeleteId(null)
      qc.invalidateQueries({ queryKey: ['crm-tasks'] })
    },
  })

  if (loading || error || !user) {
    return <CrmAccessBarrier loading={loading} user={user} error={error} retry={retry} />
  }

  const isOverdue = (t: CrmTask) =>
    t.deadline &&
    t.status !== 'done' &&
    t.status !== 'cancelled' &&
    new Date(t.deadline) < new Date()

  return (
    <CrmShell
      mePhone={user.phone}
      onRefresh={() => refetch()}
      isFetching={isFetching}
      createAction={{ label: 'Добавить задачу', onClick: () => { setCreateOpen(true); setCErr(null) } }}
    >
      <main className="mx-auto max-w-[1440px] px-4 py-6">
        <div className="mb-4">
          <h1 className="text-lg font-bold tracking-tight text-foreground">Задачи</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Задачи по лидам и сделкам: дедлайны, статусы, ответственные.
          </p>
        </div>

        {/* Фильтр по статусу */}
        <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-border bg-white px-1 py-2 sm:px-3">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              statusFilter === 'all'
                ? 'bg-brand-muted text-brand'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            Все
          </button>
          {TASK_STATUS_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm transition-colors',
                statusFilter === s
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {TASK_STATUS_LABEL[s]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => { setCreateOpen(true); setCErr(null) }}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Добавить задачу
          </button>
        </div>

        {/* Таблица задач */}
        <div className="overflow-x-auto rounded-lg border border-border bg-white shadow-sm">
          {isLoading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-[#fafbfc] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 w-8" />
                  <th className="px-3 py-3">Дедлайн</th>
                  <th className="px-3 py-3">Название</th>
                  <th className="px-3 py-3">Статус</th>
                  <th className="px-3 py-3">Объект (лид/сделка)</th>
                  <th className="px-3 py-3">Создатель</th>
                  <th className="px-3 py-3">Ответственный</th>
                  <th className="px-3 py-3 pr-4" />
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <p className="text-sm text-muted-foreground">Задач пока нет.</p>
                        <button
                          type="button"
                          onClick={() => { setCreateOpen(true); setCErr(null) }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                          <Plus className="h-4 w-4" />
                          Добавить первую задачу
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tasks.map((t) => (
                    <tr key={t.id} className={cn('border-b border-border last:border-0 hover:bg-[#f9fafb]', isOverdue(t) && 'bg-red-50/40')}>
                      <td className="px-4 py-3 align-middle">
                        {STATUS_ICON[t.status] ?? <Circle className="h-4 w-4 text-slate-400" />}
                      </td>
                      <td className={cn('whitespace-nowrap px-3 py-3 text-xs tabular-nums', isOverdue(t) && 'text-red-600 font-semibold')}>
                        {t.deadline
                          ? format(new Date(t.deadline), 'd MMM yy в HH:mm', { locale: ru })
                          : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="max-w-[280px] px-3 py-3">
                        <span className="font-medium text-foreground line-clamp-2">{t.title}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <select
                          value={t.status}
                          onChange={(e) => patchStatusMut.mutate({ id: t.id, status: e.target.value })}
                          className={cn(
                            'rounded-full border-0 px-2.5 py-0.5 text-xs font-medium cursor-pointer',
                            TASK_STATUS_BADGE[t.status] || 'bg-slate-100 text-slate-700',
                          )}
                        >
                          {TASK_STATUS_ORDER.map((s) => (
                            <option key={s} value={s}>{TASK_STATUS_LABEL[s]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="max-w-[200px] px-3 py-3 text-xs text-muted-foreground">
                        {t.opportunity_title
                          ? <span className="line-clamp-1 text-foreground">{t.opportunity_title}</span>
                          : '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">
                        {t.creator_phone || '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">
                        {t.assigned_to_phone || '—'}
                      </td>
                      <td className="px-3 py-3 pr-4 text-right">
                        {deleteId === t.id ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => deleteMut.mutate(t.id)}
                              disabled={deleteMut.isPending}
                              className="rounded bg-red-600 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              Удалить
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteId(null)}
                              className="rounded border border-border px-2 py-0.5 text-[11px]"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteId(t.id)}
                            className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Модалка создания */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Новая задача</h2>
            <form
              className="mt-4 flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault()
                if (!cTitle.trim()) { setCErr('Укажите название'); return }
                createMut.mutate()
              }}
            >
              <label className="text-xs text-muted-foreground">
                Название *
                <input
                  value={cTitle}
                  onChange={(e) => setCTitle(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                  placeholder="Позвонить клиенту…"
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Статус
                <select
                  value={cStatus}
                  onChange={(e) => setCStatus(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  {TASK_STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>{TASK_STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-muted-foreground">
                Дедлайн
                <input
                  type="datetime-local"
                  value={cDeadline}
                  onChange={(e) => setCDeadline(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                />
              </label>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Лид / сделка (опционально)</span>
                <input
                  value={cOppSearch}
                  onChange={(e) => { setCOppSearch(e.target.value); setCOppId('') }}
                  placeholder="Поиск по названию…"
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                />
                {cOppSearch.trim() && (
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-white shadow-sm">
                    {filteredOpps.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-muted-foreground">Ничего не найдено</p>
                    ) : (
                      filteredOpps.slice(0, 10).map(o => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => { setCOppId(o.id); setCOppSearch(o.title) }}
                          className={cn(
                            'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted',
                            cOppId === o.id && 'bg-primary/10 font-medium',
                          )}
                        >
                          <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold', o.kind === 'lead' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700')}>
                            {o.kind === 'lead' ? 'Л' : 'С'}
                          </span>
                          <span className="truncate">{o.title}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
                {cOppId && (
                  <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                    <span className="truncate">{cOppSearch}</span>
                    <button type="button" onClick={() => { setCOppId(''); setCOppSearch('') }} className="ml-auto shrink-0 hover:text-red-500">✕</button>
                  </div>
                )}
              </div>
              {cErr && <p className="text-sm text-red-600">{cErr}</p>}
              <div className="mt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={createMut.isPending}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {createMut.isPending ? 'Сохранение…' : 'Создать'}
                </button>
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </CrmShell>
  )
}
