'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
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

export default function CrmContactsPage() {
  const { loading, user, error: accessError, retry } = useCrmAccess()

  const { data: contacts, refetch, isFetching, isLoading, error } = useQuery({
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

  return (
    <CrmShell mePhone={user.phone} onRefresh={() => refetch()} isFetching={isFetching}>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-xl font-bold tracking-tight">Контакты</h1>
        <p className="mt-1 text-sm text-muted-foreground">Клиенты, зарегистрированные на сайте.</p>

        {error && (
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
            <span>Не удалось загрузить контакты.</span>
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
          <div className="mt-8 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : !contacts?.length ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            Нет контактов
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Телефон</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Имя</th>
                  <th className="px-4 py-3 font-medium">Заказов</th>
                  <th className="px-4 py-3 font-medium">Активен</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3 font-mono tabular-nums">{c.phone}</td>
                    <td className="px-4 py-3">{c.email || '—'}</td>
                    <td className="px-4 py-3">{c.first_name || '—'}</td>
                    <td className="px-4 py-3 tabular-nums">{c.orders_count ?? 0}</td>
                    <td className="px-4 py-3">{c.is_active ? 'да' : 'нет'}</td>
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
