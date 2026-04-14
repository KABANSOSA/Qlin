'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { CrmShell } from '@/components/crm-shell'
import { CrmAccessBarrier } from '@/components/crm-access-barrier'
import { useCrmAccess } from '@/lib/use-crm-access'

interface AdminRow {
  id: string
  phone: string
  email: string | null
  first_name: string | null
  role: string
  is_active: boolean
  created_at: string | null
}

export default function CrmAdminsPage() {
  const { loading, user, error: accessError, retry } = useCrmAccess()
  const [phone, setPhone] = useState('')
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formErr, setFormErr] = useState<string | null>(null)

  const { data: admins = [], refetch, isFetching, isLoading, error } = useQuery({
    queryKey: ['admin-admins-page', user?.id],
    queryFn: async () => {
      const { data } = await api.get<AdminRow[]>('/admin/users', { params: { role: 'admin', limit: 100 } })
      return data
    },
    enabled: !!user,
    staleTime: 30_000,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const body: { phone: string; password: string; first_name?: string; email?: string } = {
        phone: phone.trim(),
        password: password.trim(),
      }
      const fn = firstName.trim()
      if (fn) body.first_name = fn
      const em = email.trim()
      if (em) body.email = em
      await api.post('/admin/admins', body)
    },
    onSuccess: () => {
      setFormErr(null)
      setPhone('')
      setFirstName('')
      setEmail('')
      setPassword('')
      refetch()
    },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { detail?: unknown } } }
      const d = ax.response?.data?.detail
      setFormErr(typeof d === 'string' ? d : 'Не удалось сохранить')
    },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormErr(null)
    if (phone.trim().length < 10) {
      setFormErr('Укажите телефон (не короче 10 символов)')
      return
    }
    const pw = password.trim()
    if (pw.length < 8) {
      setFormErr('Пароль не короче 8 символов')
      return
    }
    createMutation.mutate()
  }

  if (loading || accessError || !user) {
    return <CrmAccessBarrier loading={loading} user={user} error={accessError} retry={retry} />
  }

  return (
    <CrmShell mePhone={user.phone} onRefresh={() => refetch()} isFetching={isFetching}>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-xl font-bold tracking-tight">Администраторы</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Добавьте нового админа или выдайте роль admin существующему клиенту по телефону (пароль задаётся заново).
        </p>

        <section className="mt-8 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <h2 className="text-sm font-semibold">Добавить / повысить до admin</h2>
          <form onSubmit={submit} className="mt-4 flex max-w-md flex-col gap-3">
            <label className="text-xs text-muted-foreground">
              Телефон *
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="+79001234567"
                autoComplete="tel"
                required
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Имя
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Иван"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Email (необязательно)
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="admin@company.ru"
                autoComplete="email"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Пароль для входа в CRM *
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="не менее 8 символов"
                autoComplete="new-password"
                required
              />
            </label>
            {formErr && <p className="text-sm text-red-600">{formErr}</p>}
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Сохранение…' : 'Сохранить'}
            </button>
          </form>
        </section>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Не удалось загрузить список.
          </div>
        )}

        <section className="mt-8">
          <h2 className="text-sm font-semibold">Список админов</h2>
          {isLoading ? (
            <p className="mt-2 text-sm text-muted-foreground">Загрузка…</p>
          ) : !admins.length ? (
            <p className="mt-2 text-sm text-muted-foreground">Пока пусто.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
              {admins.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <span className="font-medium">{a.first_name || '—'}</span>
                  <span className="tabular-nums text-muted-foreground">{a.phone}</span>
                  <span className="text-xs text-muted-foreground">{a.email || '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </CrmShell>
  )
}
