'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  ArrowUpDown,
  Mail,
  Phone,
  PlusCircle,
  Search,
  UserCircle2,
} from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { CrmShell } from '@/components/crm-shell'
import { CrmAccessBarrier } from '@/components/crm-access-barrier'
import { useCrmAccess } from '@/lib/use-crm-access'

interface ContactRow {
  id: string
  phone: string
  email?: string | null
  first_name?: string | null
  role: string
  is_active: boolean
  orders_count?: number | null
  created_at?: string | null
}

type SortKey = 'orders_count' | 'created_at' | 'first_name'

export default function CrmContactsPage() {
  const router = useRouter()
  const { loading, user, error: accessError, retry } = useCrmAccess()

  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('orders_count')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const { data: contacts = [], refetch, isFetching, isLoading, error } = useQuery({
    queryKey: ['admin-users-customers', user?.id],
    queryFn: async () => {
      const { data } = await api.get<ContactRow[]>('/admin/users', { params: { role: 'customer', limit: 200 } })
      return data
    },
    enabled: !!user,
    staleTime: 30_000,
  })

  if (loading || accessError || !user) {
    return <CrmAccessBarrier loading={loading} user={user} error={accessError} retry={retry} />
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = q
      ? contacts.filter(c =>
          [c.phone, c.email, c.first_name].filter(Boolean).join(' ').toLowerCase().includes(q)
        )
      : contacts

    return [...list].sort((a, b) => {
      let va: unknown
      let vb: unknown
      if (sortKey === 'orders_count') { va = a.orders_count ?? 0; vb = b.orders_count ?? 0 }
      else if (sortKey === 'created_at') { va = a.created_at ?? ''; vb = b.created_at ?? '' }
      else { va = a.first_name ?? ''; vb = b.first_name ?? '' }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [contacts, search, sortKey, sortDir])

  function createLeadFromContact(c: ContactRow) {
    const params = new URLSearchParams()
    params.set('action', 'new')
    params.set('phone', c.phone)
    if (c.first_name) params.set('name', c.first_name)
    router.push(`/sales?${params.toString()}`)
  }

  const SortIcon = ({ k }: { k: SortKey }) => (
    <ArrowUpDown className={cn('inline h-3 w-3 ml-0.5', sortKey === k ? 'text-primary' : 'text-muted-foreground/40')} />
  )

  return (
    <CrmShell mePhone={user.phone} onRefresh={() => refetch()} isFetching={isFetching}>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Контакты</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {contacts.length > 0 ? `${contacts.length} клиентов` : 'Клиенты, зарегистрированные на сайте'}
            </p>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Имя, телефон, email…"
              className="h-9 w-60 rounded-md border border-border bg-[#f5f6f8] pl-8 pr-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Не удалось загрузить контакты.{' '}
            <button type="button" onClick={() => refetch()} className="font-medium underline">Повторить</button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            {search ? 'Ничего не найдено' : 'Нет контактов'}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-white shadow-sm">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-[#fafbfc] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5">Клиент</th>
                  <th className="px-3 py-2.5">Телефон</th>
                  <th className="px-3 py-2.5">Email</th>
                  <th className="cursor-pointer select-none px-3 py-2.5" onClick={() => toggleSort('orders_count')}>
                    Заказов <SortIcon k="orders_count" />
                  </th>
                  <th className="cursor-pointer select-none px-3 py-2.5" onClick={() => toggleSort('created_at')}>
                    Зарегистрирован <SortIcon k="created_at" />
                  </th>
                  <th className="px-4 py-2.5">Статус</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="group border-b border-border last:border-0 transition-colors hover:bg-blue-50/30">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <UserCircle2 className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{c.first_name || <span className="text-muted-foreground">Без имени</span>}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <a href={`tel:${c.phone}`} className="tabular-nums text-primary hover:underline">{c.phone}</a>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {c.email
                        ? <div className="flex items-center gap-1.5">
                            <Mail className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <a href={`mailto:${c.email}`} className="text-primary hover:underline">{c.email}</a>
                          </div>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={cn(
                        'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                        (c.orders_count ?? 0) > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                      )}>
                        {c.orders_count ?? 0}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {c.created_at ? format(new Date(c.created_at), 'd MMM yyyy', { locale: ru }) : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-medium',
                        c.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600',
                      )}>
                        {c.is_active ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => createLeadFromContact(c)}
                        className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground hover:opacity-90"
                        title="Создать лид из этого контакта"
                      >
                        <PlusCircle className="h-3 w-3" />
                        Лид
                      </button>
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
