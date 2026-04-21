'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Building2,
  Calendar,
  CheckSquare2,
  Filter,
  LayoutGrid,
  List,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  Search,
  Send,
  Settings2,
  Trash2,
  User2,
  X,
} from 'lucide-react'
import { api } from '@/lib/api'
import { CrmShell } from '@/components/crm-shell'
import { CrmAccessBarrier } from '@/components/crm-access-barrier'
import { useCrmAccess } from '@/lib/use-crm-access'
import {
  DEAL_STAGE_ORDER,
  KIND_LABEL,
  LEAD_STAGE_ORDER,
  SEGMENT_LABEL,
  SOURCE_LABEL,
  SOURCE_OPTIONS,
  STAGE_BADGE,
  STAGE_LABEL,
  TASK_STATUS_BADGE,
  TASK_STATUS_LABEL,
  TASK_STATUS_ORDER,
} from '@/lib/crm-sales-config'
import { cn } from '@/lib/utils'

interface Opportunity {
  id: string
  kind: string
  segment: string
  stage: string
  title: string
  description: string | null
  company_name: string | null
  contact_name: string | null
  phone: string | null
  email: string | null
  estimated_value_rub: string | null
  linked_order_id: string | null
  source: string | null
  address: string | null
  area_sqm: string | null
  assigned_to_id: string | null
  assigned_to_phone: string | null
  created_at: string
  updated_at: string
}

interface CommentRow {
  id: string
  opportunity_id: string
  author_id: string | null
  author_phone: string | null
  body: string
  created_at: string
}

interface CrmTask {
  id: string
  title: string
  status: string
  deadline: string | null
  opportunity_id: string | null
  creator_phone: string | null
  assigned_to_phone: string | null
  created_at: string
}

type ActivityItem =
  | { type: 'comment'; data: CommentRow; ts: number }
  | { type: 'task'; data: CrmTask; ts: number }

type SortKey = 'id' | 'phone' | 'title' | 'segment' | 'stage' | 'value' | 'created'

function compareOpportunities(
  a: Opportunity,
  b: Opportunity,
  key: SortKey,
  dir: 'asc' | 'desc',
  stagesOrder: readonly string[],
): number {
  const mul = dir === 'asc' ? 1 : -1
  const n = (x: number) => x * mul
  switch (key) {
    case 'id':
      return n(a.id.localeCompare(b.id))
    case 'phone':
      return n((a.phone || '').localeCompare(b.phone || '', 'ru'))
    case 'title':
      return n(a.title.localeCompare(b.title, 'ru'))
    case 'segment':
      return n(a.segment.localeCompare(b.segment))
    case 'stage': {
      const ia = stagesOrder.indexOf(a.stage)
      const ib = stagesOrder.indexOf(b.stage)
      const va = ia === -1 ? 999 : ia
      const vb = ib === -1 ? 999 : ib
      return n(va - vb)
    }
    case 'value': {
      const va = Number(a.estimated_value_rub) || 0
      const vb = Number(b.estimated_value_rub) || 0
      return n(va - vb)
    }
    case 'created':
      return n(new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    default:
      return 0
  }
}

function SortTh({
  label,
  column,
  activeKey,
  sortDir,
  onSort,
  align = 'left',
}: {
  label: string
  column: SortKey
  activeKey: SortKey
  sortDir: 'asc' | 'desc'
  onSort: (k: SortKey) => void
  align?: 'left' | 'right'
}) {
  const active = activeKey === column
  const Icon = !active ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown
  return (
    <th className={cn('px-3 py-3', align === 'right' && 'text-right')}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          'inline-flex max-w-full items-center gap-1 text-xs font-semibold uppercase tracking-wide hover:text-foreground',
          align === 'right' && 'w-full justify-end',
          active ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        <span className="truncate">{label}</span>
        <Icon
          className={cn('h-3.5 w-3.5 shrink-0', active ? 'text-primary' : 'opacity-40')}
          aria-hidden
        />
      </button>
    </th>
  )
}

export default function CrmSalesPage() {
  const { loading, user, error, retry } = useCrmAccess()
  const qc = useQueryClient()
  const [kindTab, setKindTab] = useState<'lead' | 'deal'>('lead')
  const [segmentFilter, setSegmentFilter] = useState<'all' | 'b2b' | 'b2c'>('all')
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('table')
  const [tableSearch, setTableSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('created')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [createOpen, setCreateOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  const [cTitle, setCTitle] = useState('')
  const [cSegment, setCSegment] = useState<'b2b' | 'b2c'>('b2c')
  const [cDesc, setCDesc] = useState('')
  const [cCompany, setCCompany] = useState('')
  const [cContact, setCContact] = useState('')
  const [cPhone, setCPhone] = useState('')
  const [cEmail, setCEmail] = useState('')
  const [cValue, setCValue] = useState('')
  const [cOrderId, setCOrderId] = useState('')
  const [cSource, setCSource] = useState('')
  const [cAddress, setCAddress] = useState('')
  const [cAreaSqm, setCAreaSqm] = useState('')
  const [cLinkedLeadId, setCLinkedLeadId] = useState<string | null>(null)
  const [cErr, setCErr] = useState<string | null>(null)

  const [commentText, setCommentText] = useState('')
  const [detailStage, setDetailStage] = useState('')
  const [detailTab, setDetailTab] = useState<'activity' | 'contacts'>('activity')
  const [activityType, setActivityType] = useState<'comment' | 'task'>('comment')
  const [activityText, setActivityText] = useState('')
  const [activityTaskDeadline, setActivityTaskDeadline] = useState('')

  const [editMode, setEditMode] = useState(false)
  const [eTitle, setETitle] = useState('')
  const [eSegment, setESegment] = useState<'b2b' | 'b2c'>('b2c')
  const [eDesc, setEDesc] = useState('')
  const [eCompany, setECompany] = useState('')
  const [eContact, setEContact] = useState('')
  const [ePhone, setEPhone] = useState('')
  const [eEmail, setEEmail] = useState('')
  const [eValue, setEValue] = useState('')
  const [eSource, setESource] = useState('')
  const [eAddress, setEAddress] = useState('')
  const [eAreaSqm, setEAreaSqm] = useState('')
  const [eErr, setEErr] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const stages = kindTab === 'lead' ? LEAD_STAGE_ORDER : DEAL_STAGE_ORDER

  const {
    data: rows = [],
    refetch,
    isFetching,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['crm-opportunities', kindTab, segmentFilter],
    queryFn: async () => {
      const params: Record<string, string> = { kind: kindTab }
      if (segmentFilter !== 'all') params.segment = segmentFilter
      const { data } = await api.get<Opportunity[]>('/admin/crm/opportunities', { params })
      return data
    },
    enabled: !!user,
    staleTime: 15_000,
  })

  const filteredRows = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((o) => {
      const hay = [
        o.title,
        o.phone,
        o.company_name,
        o.contact_name,
        o.email,
        o.id,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [rows, tableSearch])

  const sortedRows = useMemo(() => {
    const copy = [...filteredRows]
    copy.sort((a, b) => compareOpportunities(a, b, sortKey, sortDir, stages))
    return copy
  }, [filteredRows, sortKey, sortDir, stages])

  const grouped = useMemo(() => {
    const g: Record<string, Opportunity[]> = {}
    for (const s of stages) g[s] = []
    const stageKeys = stages as readonly string[]
    for (const o of filteredRows) {
      const k = stageKeys.includes(o.stage) ? o.stage : stageKeys[0]
      if (!g[k]) g[k] = []
      g[k].push(o)
    }
    return g
  }, [filteredRows, stages])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [kindTab, segmentFilter])

  useEffect(() => {
    setSelectedIds((prev) => {
      const allowed = new Set(rows.map((r) => r.id))
      const next = new Set([...prev].filter((id) => allowed.has(id)))
      return next.size === prev.size && [...prev].every((id) => next.has(id)) ? prev : next
    })
  }, [rows])

  const toggleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev !== key) {
        setSortDir(key === 'created' || key === 'value' ? 'desc' : 'asc')
        return key
      }
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      return prev
    })
  }, [])

  const visibleIds = useMemo(() => sortedRows.map((r) => r.id), [sortedRows])
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id))
  const someVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.some((id) => selectedIds.has(id)) &&
    !allVisibleSelected

  const toggleSelectAllVisible = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id))
      } else {
        visibleIds.forEach((id) => next.add(id))
      }
      return next
    })
  }, [allVisibleSelected, visibleIds])

  const toggleSelectOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const activeFilterCount =
    (segmentFilter !== 'all' ? 1 : 0) + (tableSearch.trim() ? 1 : 0)

  const detail = detailId ? rows.find((x) => x.id === detailId) : null

  const detailStages = detail
    ? detail.kind === 'lead'
      ? LEAD_STAGE_ORDER
      : DEAL_STAGE_ORDER
    : stages

  useEffect(() => {
    if (detail) setDetailStage(detail.stage)
  }, [detail?.id, detail?.stage])

  const commentsQuery = useQuery({
    queryKey: ['crm-comments', detailId],
    queryFn: async () => {
      const { data } = await api.get<CommentRow[]>(`/admin/crm/opportunities/${detailId}/comments`)
      return data
    },
    enabled: !!detailId && !!user,
  })

  const createMut = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        kind: kindTab,
        segment: cSegment,
        title: cTitle.trim(),
      }
      if (cDesc.trim()) body.description = cDesc.trim()
      if (cCompany.trim()) body.company_name = cCompany.trim()
      if (cContact.trim()) body.contact_name = cContact.trim()
      if (cPhone.trim()) body.phone = cPhone.trim()
      if (cEmail.trim()) body.email = cEmail.trim()
      if (cValue.trim()) {
        const n = Number(cValue.replace(',', '.'))
        if (!Number.isNaN(n)) body.estimated_value_rub = n
      }
      if (cOrderId.trim()) body.linked_order_id = cOrderId.trim()
      if (cSource) body.source = cSource
      if (cLinkedLeadId) body.linked_lead_id = cLinkedLeadId
      if (kindTab === 'deal') {
        if (cAddress.trim()) body.address = cAddress.trim()
        if (cAreaSqm.trim()) {
          const n = Number(cAreaSqm.replace(',', '.'))
          if (!Number.isNaN(n)) body.area_sqm = n
        }
      }
      await api.post('/admin/crm/opportunities', body)
    },
    onSuccess: () => {
      setCreateOpen(false)
      setCErr(null)
      setCTitle('')
      setCDesc('')
      setCCompany('')
      setCContact('')
      setCPhone('')
      setCEmail('')
      setCValue('')
      setCOrderId('')
      setCSource('')
      setCAddress('')
      setCAreaSqm('')
      setCLinkedLeadId(null)
      qc.invalidateQueries({ queryKey: ['crm-opportunities'] })
    },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { detail?: string } } }
      setCErr(ax.response?.data?.detail || 'Ошибка сохранения')
    },
  })

  const patchStageMut = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      await api.patch(`/admin/crm/opportunities/${id}`, { stage })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-opportunities'] })
    },
  })

  const addCommentMut = useMutation({
    mutationFn: async () => {
      if (!detailId || !commentText.trim()) return
      await api.post(`/admin/crm/opportunities/${detailId}/comments`, { body: commentText.trim() })
    },
    onSuccess: () => {
      setCommentText('')
      qc.invalidateQueries({ queryKey: ['crm-comments', detailId] })
    },
  })

  const detailTasksQuery = useQuery({
    queryKey: ['crm-tasks-for-opp', detailId],
    queryFn: async () => {
      const { data } = await api.get<CrmTask[]>('/admin/crm/tasks', {
        params: { opportunity_id: detailId },
      })
      return data
    },
    enabled: !!detailId && !!user,
  })

  const createActivityMut = useMutation({
    mutationFn: async () => {
      if (!detailId || !activityText.trim()) return
      if (activityType === 'comment') {
        await api.post(`/admin/crm/opportunities/${detailId}/comments`, { body: activityText.trim() })
      } else {
        const body: Record<string, unknown> = {
          title: activityText.trim(),
          status: 'todo',
          opportunity_id: detailId,
        }
        if (activityTaskDeadline) body.deadline = new Date(activityTaskDeadline).toISOString()
        await api.post('/admin/crm/tasks', body)
      }
    },
    onSuccess: () => {
      setActivityText('')
      setActivityTaskDeadline('')
      if (activityType === 'comment') {
        qc.invalidateQueries({ queryKey: ['crm-comments', detailId] })
      } else {
        qc.invalidateQueries({ queryKey: ['crm-tasks-for-opp', detailId] })
      }
    },
  })

  const patchTaskStatusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/admin/crm/tasks/${id}`, { status })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-tasks-for-opp', detailId] }),
  })

  const editMut = useMutation({
    mutationFn: async () => {
      if (!detailId) return
      const body: Record<string, unknown> = {
        segment: eSegment,
        title: eTitle.trim(),
        stage: detailStage,
      }
      body.description = eDesc.trim() || null
      body.company_name = eCompany.trim() || null
      body.contact_name = eContact.trim() || null
      body.phone = ePhone.trim() || null
      body.email = eEmail.trim() || null
      body.source = eSource || null
      if (detail?.kind === 'deal') {
        body.address = eAddress.trim() || null
        if (eAreaSqm.trim()) {
          const n = Number(eAreaSqm.replace(',', '.'))
          body.area_sqm = Number.isNaN(n) ? null : n
        } else {
          body.area_sqm = null
        }
      }
      if (eValue.trim()) {
        const n = Number(eValue.replace(',', '.'))
        if (!Number.isNaN(n)) body.estimated_value_rub = n
      } else {
        body.estimated_value_rub = null
      }
      await api.patch(`/admin/crm/opportunities/${detailId}`, body)
    },
    onSuccess: () => {
      setEditMode(false)
      setEErr(null)
      qc.invalidateQueries({ queryKey: ['crm-opportunities'] })
    },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { detail?: string } } }
      setEErr(ax.response?.data?.detail || 'Ошибка сохранения')
    },
  })

  const deleteMut = useMutation({
    mutationFn: async () => {
      if (!detailId) return
      await api.delete(`/admin/crm/opportunities/${detailId}`)
    },
    onSuccess: () => {
      setDetailId(null)
      setDeleteConfirm(false)
      qc.invalidateQueries({ queryKey: ['crm-opportunities'] })
    },
  })

  if (loading || error || !user) {
    return <CrmAccessBarrier loading={loading} user={user} error={error} retry={retry} />
  }

  const openDetail = (o: Opportunity) => {
    setDetailId(o.id)
    setDetailStage(o.stage)
    setCommentText('')
    setEditMode(false)
    setDeleteConfirm(false)
    setDetailTab('activity')
    setActivityText('')
    setActivityType('comment')
    setActivityTaskDeadline('')
    setEErr(null)
    setETitle(o.title)
    setESegment(o.segment as 'b2b' | 'b2c')
    setEDesc(o.description || '')
    setECompany(o.company_name || '')
    setEContact(o.contact_name || '')
    setEPhone(o.phone || '')
    setEEmail(o.email || '')
    setEValue(o.estimated_value_rub != null ? String(o.estimated_value_rub) : '')
    setESource(o.source || '')
    setEAddress(o.address || '')
    setEAreaSqm(o.area_sqm != null ? String(o.area_sqm) : '')
  }

  const closeDetail = () => {
    setDetailId(null)
    setEditMode(false)
    setDeleteConfirm(false)
  }

  const getStageProgress = (stage: string, kind: string) => {
    const order = kind === 'lead' ? [...LEAD_STAGE_ORDER] : [...DEAL_STAGE_ORDER]
    const active = order.filter((s) => s !== 'lost')
    if (stage === 'lost') return { num: active.length, total: active.length, label: 'Потерян', isLost: true }
    const idx = active.indexOf(stage)
    return { num: idx + 1, total: active.length, label: STAGE_LABEL[stage] || stage, isLost: false }
  }

  const convertToDeal = (lead: Opportunity) => {
    closeDetail()
    setKindTab('deal')
    setCTitle(`Сделка: ${lead.title}`)
    setCContact(lead.contact_name || '')
    setCPhone(lead.phone || '')
    setCEmail(lead.email || '')
    setCCompany(lead.company_name || '')
    setCSegment(lead.segment as 'b2b' | 'b2c')
    setCLinkedLeadId(lead.id)
    setCErr(null)
    setCreateOpen(true)
  }

  const activityFeed = useMemo((): ActivityItem[] => {
    const comments: ActivityItem[] = (commentsQuery.data || []).map((c) => ({
      type: 'comment',
      data: c,
      ts: new Date(c.created_at).getTime(),
    }))
    const tasks: ActivityItem[] = (detailTasksQuery.data || []).map((t) => ({
      type: 'task',
      data: t,
      ts: new Date(t.created_at).getTime(),
    }))
    return [...comments, ...tasks].sort((a, b) => b.ts - a.ts)
  }, [commentsQuery.data, detailTasksQuery.data])

  const viewTitle = kindTab === 'lead' ? 'Все лиды' : 'Все сделки'

  return (
    <CrmShell
      mePhone={user.phone}
      onRefresh={() => refetch()}
      isFetching={isFetching}
      headerSearch={{
        value: tableSearch,
        onChange: setTableSearch,
        placeholder: 'Поиск по лидам и сделкам',
      }}
      createAction={{
        label: 'Создать',
        onClick: () => {
          setCreateOpen(true)
          setCErr(null)
        },
      }}
    >
      <main className="mx-auto max-w-[1920px] px-4 py-6">
        <div className="mb-4">
          <h1 className="text-lg font-bold tracking-tight text-foreground">Лиды и сделки</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Собственные записи CRM: B2B и B2C, этапы воронки, комментарии. Заявки уборки — в разделе «Воронка».
          </p>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-border bg-white px-1 py-2 sm:px-3">
          {(['lead', 'deal'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKindTab(k)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                kindTab === k
                  ? 'bg-brand-muted text-brand'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {KIND_LABEL[k]}
            </button>
          ))}
          <span className="mx-1 hidden h-4 w-px bg-border sm:block" aria-hidden />
          {(['all', 'b2b', 'b2c'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSegmentFilter(s)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm',
                segmentFilter === s
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {s === 'all' ? 'Все сегменты' : SEGMENT_LABEL[s]}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 rounded-t-lg border border-b-0 border-border bg-white px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <h2 className="text-sm font-semibold text-foreground">{viewTitle}</h2>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md border border-border bg-[#f5f6f8] px-2 py-0.5 text-xs text-muted-foreground">
                <Filter className="h-3.5 w-3.5" />
                {activeFilterCount}{' '}
                {activeFilterCount === 1
                  ? 'фильтр'
                  : activeFilterCount < 5
                    ? 'фильтра'
                    : 'фильтров'}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setCreateOpen(true)
                setCErr(null)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              {kindTab === 'lead' ? 'Добавить лид' : 'Добавить сделку'}
            </button>
            <div className="inline-flex rounded-md border border-border p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Список"
                className={cn(
                  'inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium',
                  viewMode === 'table'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Список</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                title="Канбан"
                className={cn(
                  'inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium',
                  viewMode === 'kanban'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Канбан</span>
              </button>
            </div>
            <div className="relative min-w-[180px] flex-1 sm:max-w-md">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Поиск по таблице…"
                className="h-9 w-full rounded-md border border-border bg-[#f5f6f8] pl-8 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-[#E31E24]/25"
              />
            </div>
            <button
              type="button"
              className="hidden rounded-md border border-border p-2 text-muted-foreground hover:bg-muted lg:inline-flex"
              aria-label="Настройки таблицы"
              title="Скоро"
            >
              <Settings2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isError && (
          <div className="rounded-b-lg border border-t-0 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Не удалось загрузить данные.
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-b-lg border border-border bg-white">
            <div
              className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent"
              role="status"
              aria-label="Загрузка"
            />
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto rounded-b-lg border border-border bg-white shadow-sm">
            {selectedIds.size > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-brand-muted/60 px-4 py-2 text-sm">
                <span className="font-medium text-foreground">
                  Выбрано: {selectedIds.size}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="text-xs font-medium text-brand hover:underline"
                >
                  Снять выделение
                </button>
              </div>
            )}
            <table className="w-full min-w-[960px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-[#fafbfc]">
                  <th className="w-10 px-2 py-3 pl-3">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someVisibleSelected
                      }}
                      onChange={toggleSelectAllVisible}
                      disabled={visibleIds.length === 0}
                      className="h-4 w-4 rounded border-border"
                      aria-label="Выбрать все на странице"
                    />
                  </th>
                  <SortTh
                    label="ID"
                    column="id"
                    activeKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {kindTab === 'lead' ? 'Телефон' : 'Адрес / Площадь'}
                  </th>
                  <SortTh
                    label="Название"
                    column="title"
                    activeKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <SortTh
                    label="Сегмент"
                    column="segment"
                    activeKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <SortTh
                    label="Этап"
                    column="stage"
                    activeKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Источник
                  </th>
                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Ответственный
                  </th>
                  <SortTh
                    label="Сумма"
                    column="value"
                    activeKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                    align="right"
                  />
                  <SortTh
                    label="Создано"
                    column="created"
                    activeKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <th className="px-3 py-3 pr-4" />
                </tr>
              </thead>
              <tbody>
                {sortedRows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center">
                      {rows.length === 0 ? (
                        <div className="flex flex-col items-center gap-3">
                          <p className="text-sm text-muted-foreground">
                            Пока нет {kindTab === 'lead' ? 'лидов' : 'сделок'}.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setCreateOpen(true)
                              setCErr(null)
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                          >
                            <Plus className="h-4 w-4" />
                            {kindTab === 'lead' ? 'Добавить первый лид' : 'Добавить первую сделку'}
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Ничего не найдено по поиску.</p>
                      )}
                    </td>
                  </tr>
                ) : (
                  sortedRows.map((o) => (
                    <tr
                      key={o.id}
                      className="border-b border-border last:border-0 hover:bg-[#f9fafb]"
                    >
                      <td className="px-2 py-2.5 pl-3 align-middle">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(o.id)}
                          onChange={() => toggleSelectOne(o.id)}
                          className="h-4 w-4 rounded border-border"
                          aria-label={`Выбрать ${o.title}`}
                        />
                      </td>
                      <td className="max-w-[100px] px-3 py-2.5 font-mono text-xs text-muted-foreground">
                        {o.id.slice(0, 8)}…
                      </td>
                      <td className="max-w-[180px] px-3 py-2.5">
                        {o.kind === 'deal' ? (
                          <div>
                            <div className="text-xs text-foreground line-clamp-1">{o.address || '—'}</div>
                            {o.area_sqm != null && (
                              <div className="text-[11px] text-muted-foreground">{Number(o.area_sqm)} м²</div>
                            )}
                          </div>
                        ) : (
                          <span className="whitespace-nowrap tabular-nums text-foreground">{o.phone || '—'}</span>
                        )}
                      </td>
                      <td className="max-w-[280px] px-3 py-2.5">
                        <div className="font-medium text-foreground line-clamp-2">{o.title}</div>
                        {o.company_name && (
                          <div className="text-xs text-muted-foreground line-clamp-1">{o.company_name}</div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="rounded bg-muted px-2 py-0.5 text-xs">
                          {SEGMENT_LABEL[o.segment] || o.segment}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', STAGE_BADGE[o.stage] || 'bg-slate-100 text-slate-700')}>
                          {STAGE_LABEL[o.stage] || o.stage}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">
                        {o.source ? SOURCE_LABEL[o.source] || o.source : '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">
                        {o.assigned_to_phone || '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">
                        {o.estimated_value_rub != null && Number(o.estimated_value_rub) > 0
                          ? `${Number(o.estimated_value_rub).toLocaleString('ru-RU')} ₽`
                          : '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">
                        {format(new Date(o.created_at), 'd MMM yyyy, HH:mm', { locale: ru })}
                      </td>
                      <td className="px-3 py-2.5 pr-4 text-right">
                        <button
                          type="button"
                          onClick={() => openDetail(o)}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Открыть
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto rounded-b-lg border border-t-0 border-border bg-transparent pb-4 pt-4">
            {stages.map((st) => (
              <div
                key={st}
                className="flex w-[260px] shrink-0 flex-col rounded-xl border border-border bg-white p-4 shadow-sm"
              >
                <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {STAGE_LABEL[st] || st}{' '}
                  <span className="text-foreground">({grouped[st]?.length ?? 0})</span>
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  {(grouped[st] ?? []).map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => openDetail(o)}
                      className="rounded-lg border border-border bg-card p-3 text-left text-xs shadow-sm hover:bg-muted/50"
                    >
                      <div className="font-semibold text-foreground line-clamp-2">{o.title}</div>
                      {o.kind === 'deal' && o.address && (
                        <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">{o.address}</p>
                      )}
                      {o.kind === 'deal' && o.area_sqm != null && (
                        <p className="text-[10px] text-muted-foreground">{Number(o.area_sqm)} м²</p>
                      )}
                      {o.kind === 'lead' && o.company_name && (
                        <p className="mt-1 text-muted-foreground line-clamp-1">{o.company_name}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium">
                          {SEGMENT_LABEL[o.segment] || o.segment}
                        </span>
                        {o.kind === 'lead' && o.source && (
                          <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[10px] text-violet-700">
                            {SOURCE_LABEL[o.source] || o.source}
                          </span>
                        )}
                        {o.kind === 'lead' && o.phone && (
                          <span className="text-[10px] text-muted-foreground tabular-nums">{o.phone}</span>
                        )}
                      </div>
                      {o.assigned_to_phone && (
                        <p className="mt-1 text-[10px] text-muted-foreground">→ {o.assigned_to_phone}</p>
                      )}
                      {o.estimated_value_rub != null && Number(o.estimated_value_rub) > 0 && (
                        <p className="mt-1 text-[11px] font-medium tabular-nums">
                          {Number(o.estimated_value_rub).toLocaleString('ru-RU')} ₽
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold">
              Новый {kindTab === 'lead' ? 'лид' : 'сделка'} ({KIND_LABEL[kindTab]})
            </h2>
            <form
              className="mt-4 flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault()
                setCErr(null)
                if (cTitle.trim().length < 1) {
                  setCErr('Укажите название')
                  return
                }
                createMut.mutate()
              }}
            >
              <label className="text-xs text-muted-foreground">
                Сегмент *
                <select
                  value={cSegment}
                  onChange={(e) => setCSegment(e.target.value as 'b2b' | 'b2c')}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="b2c">B2C — физическое лицо</option>
                  <option value="b2b">B2B — компания</option>
                </select>
              </label>

              <label className="text-xs text-muted-foreground">
                Название *
                <input
                  value={cTitle}
                  onChange={(e) => setCTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                  placeholder={kindTab === 'lead' ? 'Заявка от Ивана, ул. Ленина...' : 'Уборка офиса, Садовая 12...'}
                  required
                />
              </label>

              {kindTab === 'lead' ? (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Контакт</p>
                  <label className="text-xs text-muted-foreground">
                    Имя клиента
                    <input
                      value={cContact}
                      onChange={(e) => setCContact(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                      placeholder="Иван Петров"
                    />
                  </label>
                  <label className="text-xs text-muted-foreground">
                    Телефон
                    <input
                      value={cPhone}
                      onChange={(e) => setCPhone(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                      placeholder="+7 900 000-00-00"
                    />
                  </label>
                  <label className="text-xs text-muted-foreground">
                    Email
                    <input
                      type="email"
                      value={cEmail}
                      onChange={(e) => setCEmail(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                    />
                  </label>
                  {cSegment === 'b2b' && (
                    <label className="text-xs text-muted-foreground">
                      Компания
                      <input
                        value={cCompany}
                        onChange={(e) => setCCompany(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                      />
                    </label>
                  )}
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Заявка</p>
                  <label className="text-xs text-muted-foreground">
                    Источник
                    <select
                      value={cSource}
                      onChange={(e) => setCSource(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Не указан</option>
                      {SOURCE_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs text-muted-foreground">
                    Описание / примечание
                    <textarea
                      value={cDesc}
                      onChange={(e) => setCDesc(e.target.value)}
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                      placeholder="Хочет уборку 2к квартиры, срочно..."
                    />
                  </label>
                </>
              ) : (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Объект уборки</p>
                  <label className="text-xs text-muted-foreground">
                    Адрес *
                    <input
                      value={cAddress}
                      onChange={(e) => setCAddress(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                      placeholder="г. Москва, ул. Садовая, д. 12, кв. 34"
                    />
                  </label>
                  <label className="text-xs text-muted-foreground">
                    Площадь (м²)
                    <input
                      value={cAreaSqm}
                      onChange={(e) => setCAreaSqm(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                      placeholder="45"
                    />
                  </label>
                  <label className="text-xs text-muted-foreground">
                    Сумма (₽)
                    <input
                      value={cValue}
                      onChange={(e) => setCValue(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                      placeholder="5000"
                    />
                  </label>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Контакт</p>
                  <label className="text-xs text-muted-foreground">
                    Имя клиента
                    <input
                      value={cContact}
                      onChange={(e) => setCContact(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                      placeholder="Иван Петров"
                    />
                  </label>
                  <label className="text-xs text-muted-foreground">
                    Телефон
                    <input
                      value={cPhone}
                      onChange={(e) => setCPhone(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                    />
                  </label>
                  {cSegment === 'b2b' && (
                    <label className="text-xs text-muted-foreground">
                      Компания
                      <input
                        value={cCompany}
                        onChange={(e) => setCCompany(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                      />
                    </label>
                  )}
                  <label className="text-xs text-muted-foreground">
                    Описание / примечание
                    <textarea
                      value={cDesc}
                      onChange={(e) => setCDesc(e.target.value)}
                      rows={2}
                      className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                    />
                  </label>
                </>
              )}

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

      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
          <div className="flex h-full w-full max-w-[960px] flex-col bg-white shadow-2xl">
            {/* ── HEADER ── */}
            {(() => {
              const sp = getStageProgress(detailStage, detail.kind)
              return (
                <div className="flex shrink-0 items-center gap-3 border-b border-border bg-white px-5 py-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white', detail.kind === 'lead' ? 'bg-blue-500' : 'bg-emerald-500')}>
                      {detail.kind === 'lead' ? 'Л' : 'С'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {KIND_LABEL[detail.kind]} · {SEGMENT_LABEL[detail.segment]}
                      </p>
                      <h2 className="truncate text-base font-semibold leading-tight text-foreground">{detail.title}</h2>
                    </div>
                  </div>
                  {detail.estimated_value_rub != null && Number(detail.estimated_value_rub) > 0 && (
                    <span className="shrink-0 text-base font-bold tabular-nums text-foreground">
                      {Number(detail.estimated_value_rub).toLocaleString('ru-RU')} ₽
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const next = sp.isLost
                        ? detailStages[0]
                        : detailStages[(detailStages.indexOf(detailStage) + 1) % detailStages.length]
                      setDetailStage(next)
                      patchStageMut.mutate({ id: detail.id, stage: next })
                    }}
                    className={cn(
                      'shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-opacity hover:opacity-80',
                      sp.isLost ? 'bg-red-100 text-red-700' : 'bg-blue-500 text-white',
                    )}
                  >
                    Этап {sp.num} из {sp.total}: {sp.label}
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    {detail.kind === 'lead' && (
                      <button
                        type="button"
                        onClick={() => convertToDeal(detail)}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                        Создать сделку
                      </button>
                    )}
                    <button
                      type="button"
                      title="Редактировать"
                      onClick={() => setDetailTab(detailTab === 'contacts' ? 'activity' : 'contacts')}
                      className={cn('rounded-lg p-1.5 hover:bg-muted', detailTab === 'contacts' ? 'text-primary' : 'text-muted-foreground')}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title="Удалить"
                      onClick={() => setDeleteConfirm(!deleteConfirm)}
                      className="rounded-lg p-1.5 text-red-400 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={closeDetail} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )
            })()}

            {deleteConfirm && (
              <div className="shrink-0 border-b border-red-200 bg-red-50 px-5 py-2.5">
                <div className="flex items-center gap-3">
                  <p className="flex-1 text-sm text-red-800">Удалить безвозвратно?</p>
                  <button type="button" disabled={deleteMut.isPending} onClick={() => deleteMut.mutate()} className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">
                    {deleteMut.isPending ? 'Удаление…' : 'Да'}
                  </button>
                  <button type="button" onClick={() => setDeleteConfirm(false)} className="rounded-md border border-border px-3 py-1 text-xs">Нет</button>
                </div>
              </div>
            )}

            {/* ── BODY ── */}
            <div className="flex min-h-0 flex-1 overflow-hidden">

              {/* LEFT SIDEBAR */}
              <div className="flex w-64 shrink-0 flex-col gap-4 overflow-y-auto border-r border-border bg-[#fafbfc] p-4">

                {detail.kind === 'lead' ? (
                  <>
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Контакт</p>
                      <div className="space-y-1.5">
                        {detail.contact_name && (
                          <div className="flex items-center gap-2 text-sm">
                            <User2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span>{detail.contact_name}</span>
                          </div>
                        )}
                        {detail.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <a href={`tel:${detail.phone}`} className="text-primary hover:underline">{detail.phone}</a>
                          </div>
                        )}
                        {detail.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <a href={`mailto:${detail.email}`} className="truncate text-primary hover:underline">{detail.email}</a>
                          </div>
                        )}
                        {detail.company_name && (
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span>{detail.company_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Источник</p>
                      <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs text-violet-700">
                        {detail.source ? SOURCE_LABEL[detail.source] || detail.source : 'Не указан'}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Объект уборки</p>
                      {detail.address ? (
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span>{detail.address}</span>
                        </div>
                      ) : <p className="text-xs text-muted-foreground">Адрес не указан</p>}
                      {detail.area_sqm != null && (
                        <p className="mt-1 text-xs text-muted-foreground">{Number(detail.area_sqm)} м²</p>
                      )}
                    </div>
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Клиент</p>
                      <div className="space-y-1.5">
                        {detail.contact_name && (
                          <div className="flex items-center gap-2 text-sm">
                            <User2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span>{detail.contact_name}</span>
                          </div>
                        )}
                        {detail.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <a href={`tel:${detail.phone}`} className="text-primary hover:underline">{detail.phone}</a>
                          </div>
                        )}
                        {detail.company_name && (
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span>{detail.company_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Этап</p>
                  <select
                    value={detailStage}
                    onChange={(e) => {
                      const v = e.target.value
                      setDetailStage(v)
                      patchStageMut.mutate({ id: detail.id, stage: v })
                    }}
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs"
                  >
                    {detailStages.map((s) => (
                      <option key={s} value={s}>{STAGE_LABEL[s] || s}</option>
                    ))}
                  </select>
                </div>

                {detail.assigned_to_phone && (
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Ответственный</p>
                    <p className="text-sm">{detail.assigned_to_phone}</p>
                  </div>
                )}

                {detail.description && (
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Описание</p>
                    <p className="whitespace-pre-wrap text-xs text-foreground">{detail.description}</p>
                  </div>
                )}

                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Создан</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(detail.created_at), 'd MMM yyyy, HH:mm', { locale: ru })}</p>
                </div>
              </div>

              {/* RIGHT CONTENT */}
              <div className="flex flex-1 flex-col overflow-hidden">

                {/* TABS */}
                <div className="flex shrink-0 border-b border-border bg-white px-4">
                  {(['activity', 'contacts'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setDetailTab(tab)}
                      className={cn(
                        'border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                        detailTab === tab
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {tab === 'activity' ? 'Активность' : 'Редактировать'}
                    </button>
                  ))}
                </div>

                {/* TAB CONTENT */}
                <div className="flex-1 overflow-y-auto">

                  {detailTab === 'activity' && (
                    <div className="flex flex-col gap-0">
                      {/* INPUT AREA */}
                      <div className="border-b border-border bg-white p-4">
                        <div className="mb-2 flex gap-1">
                          {(['comment', 'task'] as const).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setActivityType(t)}
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium',
                                activityType === t
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
                              )}
                            >
                              {t === 'comment' ? <MessageSquare className="h-3.5 w-3.5" /> : <CheckSquare2 className="h-3.5 w-3.5" />}
                              {t === 'comment' ? 'Комментарий' : 'Задача'}
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={activityText}
                          onChange={(e) => setActivityText(e.target.value)}
                          rows={2}
                          placeholder={activityType === 'comment' ? 'Написать комментарий…' : 'Название задачи…'}
                          className="w-full resize-none rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/25"
                        />
                        {activityType === 'task' && (
                          <input
                            type="datetime-local"
                            value={activityTaskDeadline}
                            onChange={(e) => setActivityTaskDeadline(e.target.value)}
                            className="mt-2 w-full rounded-lg border border-border px-3 py-1.5 text-xs"
                          />
                        )}
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            disabled={!activityText.trim() || createActivityMut.isPending}
                            onClick={() => createActivityMut.mutate()}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
                          >
                            <Send className="h-3.5 w-3.5" />
                            {createActivityMut.isPending ? 'Отправка…' : 'Отправить'}
                          </button>
                        </div>
                      </div>

                      {/* FEED */}
                      <div className="divide-y divide-border">
                        {(commentsQuery.isLoading || detailTasksQuery.isLoading) && (
                          <p className="px-5 py-6 text-sm text-muted-foreground">Загрузка…</p>
                        )}
                        {activityFeed.length === 0 && !commentsQuery.isLoading && !detailTasksQuery.isLoading && (
                          <div className="flex flex-col items-center gap-2 px-5 py-10">
                            <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
                            <p className="text-sm text-muted-foreground">Нет активности. Добавьте комментарий или задачу.</p>
                          </div>
                        )}
                        {activityFeed.map((item) => (
                          <div key={item.type + item.data.id} className="flex gap-3 px-5 py-3.5">
                            <div className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full', item.type === 'comment' ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500')}>
                              {item.type === 'comment' ? <MessageSquare className="h-3.5 w-3.5" /> : <CheckSquare2 className="h-3.5 w-3.5" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              {item.type === 'comment' ? (
                                <>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-foreground">{item.data.author_phone || 'Система'}</span>
                                    <span className="text-[10px] text-muted-foreground">{format(new Date(item.data.created_at), 'd MMM, HH:mm', { locale: ru })}</span>
                                  </div>
                                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{(item.data as CommentRow).body}</p>
                                </>
                              ) : (
                                <>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-medium text-foreground">{(item.data as CrmTask).title}</span>
                                    <select
                                      value={(item.data as CrmTask).status}
                                      onChange={(e) => patchTaskStatusMut.mutate({ id: item.data.id, status: e.target.value })}
                                      className={cn('rounded-full border-0 px-2 py-0.5 text-[10px] font-semibold cursor-pointer', TASK_STATUS_BADGE[(item.data as CrmTask).status] || 'bg-slate-100 text-slate-700')}
                                    >
                                      {TASK_STATUS_ORDER.map((s) => (
                                        <option key={s} value={s}>{TASK_STATUS_LABEL[s]}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                                    {(item.data as CrmTask).deadline && (
                                      <span className="inline-flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date((item.data as CrmTask).deadline!), 'd MMM yyyy, HH:mm', { locale: ru })}
                                      </span>
                                    )}
                                    <span>{format(new Date(item.data.created_at), 'd MMM, HH:mm', { locale: ru })}</span>
                                    {(item.data as CrmTask).assigned_to_phone && (
                                      <span>→ {(item.data as CrmTask).assigned_to_phone}</span>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {detailTab === 'contacts' && (
                    <div className="p-5">
                      <form
                        className="flex flex-col gap-3"
                        onSubmit={(e) => {
                          e.preventDefault()
                          if (!eTitle.trim()) { setEErr('Укажите название'); return }
                          editMut.mutate()
                        }}
                      >
                        <div className="grid grid-cols-2 gap-3">
                          <label className="text-xs text-muted-foreground">
                            Сегмент
                            <select value={eSegment} onChange={(e) => setESegment(e.target.value as 'b2b' | 'b2c')} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                              <option value="b2c">B2C</option>
                              <option value="b2b">B2B</option>
                            </select>
                          </label>
                          <label className="text-xs text-muted-foreground">
                            Сумма (₽)
                            <input value={eValue} onChange={(e) => setEValue(e.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
                          </label>
                        </div>
                        <label className="text-xs text-muted-foreground">
                          Название *
                          <input value={eTitle} onChange={(e) => setETitle(e.target.value)} required className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="text-xs text-muted-foreground">
                            Имя клиента
                            <input value={eContact} onChange={(e) => setEContact(e.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
                          </label>
                          <label className="text-xs text-muted-foreground">
                            Телефон
                            <input value={ePhone} onChange={(e) => setEPhone(e.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
                          </label>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="text-xs text-muted-foreground">
                            Email
                            <input type="email" value={eEmail} onChange={(e) => setEEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
                          </label>
                          <label className="text-xs text-muted-foreground">
                            Компания
                            <input value={eCompany} onChange={(e) => setECompany(e.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
                          </label>
                        </div>
                        {detail.kind === 'lead' ? (
                          <label className="text-xs text-muted-foreground">
                            Источник
                            <select value={eSource} onChange={(e) => setESource(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                              <option value="">Не указан</option>
                              {SOURCE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                          </label>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <label className="text-xs text-muted-foreground">
                              Адрес
                              <input value={eAddress} onChange={(e) => setEAddress(e.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" placeholder="ул. Садовая, д. 12" />
                            </label>
                            <label className="text-xs text-muted-foreground">
                              Площадь (м²)
                              <input value={eAreaSqm} onChange={(e) => setEAreaSqm(e.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" placeholder="45" />
                            </label>
                          </div>
                        )}
                        <label className="text-xs text-muted-foreground">
                          Описание
                          <textarea value={eDesc} onChange={(e) => setEDesc(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
                        </label>
                        {eErr && <p className="text-sm text-red-600">{eErr}</p>}
                        <div className="flex gap-2 pt-1">
                          <button type="submit" disabled={editMut.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                            {editMut.isPending ? 'Сохранение…' : 'Сохранить изменения'}
                          </button>
                          <button type="button" onClick={() => setDetailTab('activity')} className="rounded-lg border border-border px-4 py-2 text-sm">Отмена</button>
                        </div>
                      </form>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </CrmShell>
  )
}
