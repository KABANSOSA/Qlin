'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface AssignOrderMinimal {
  id: string
  order_number: string
  address: string
}

interface CleanerRow {
  user_id: string
  phone: string
  first_name: string
  is_available: boolean
  rating: number | null
}

interface AssignCleanerModalProps {
  order: AssignOrderMinimal | null
  userId: string | undefined
  onClose: () => void
  onAssigned: () => void
}

export function AssignCleanerModal({ order, userId, onClose, onAssigned }: AssignCleanerModalProps) {
  const [pickCleanerId, setPickCleanerId] = useState('')
  const [assignErr, setAssignErr] = useState<string | null>(null)

  useEffect(() => {
    if (order) {
      setPickCleanerId('')
      setAssignErr(null)
    }
  }, [order])

  const { data: cleaners = [] } = useQuery({
    queryKey: ['admin-cleaners', userId],
    queryFn: async () => {
      const { data } = await api.get<CleanerRow[]>('/admin/cleaners')
      return data
    },
    enabled: !!userId && !!order,
    staleTime: 60_000,
  })

  const assignMutation = useMutation({
    mutationFn: async ({ orderId, cleanerId }: { orderId: string; cleanerId: string }) => {
      await api.post(`/admin/orders/${orderId}/assign`, { cleaner_id: cleanerId })
    },
    onSuccess: () => {
      onAssigned()
      onClose()
    },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { detail?: unknown } } }
      const d = ax.response?.data?.detail
      setAssignErr(typeof d === 'string' ? d : 'Не удалось назначить исполнителя')
    },
  })

  if (!order) return null

  const submit = () => {
    if (!pickCleanerId) {
      setAssignErr('Выберите исполнителя из списка')
      return
    }
    setAssignErr(null)
    assignMutation.mutate({ orderId: order.id, cleanerId: pickCleanerId })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-cleaner-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl">
        <h2 id="assign-cleaner-title" className="text-base font-semibold">
          Назначить исполнителя
        </h2>
        <p className="mt-1 text-xs text-muted-foreground font-mono">{order.order_number}</p>
        <p className="mt-2 text-sm text-foreground line-clamp-3">{order.address}</p>

        {cleaners.length === 0 ? (
          <p className="mt-4 text-sm text-amber-800">
            Нет уборщиков с профилем. Нужен пользователь с ролью <code className="rounded bg-muted px-1">cleaner</code> и
            запись в таблице <code className="rounded bg-muted px-1">cleaners</code>.
          </p>
        ) : (
          <label className="mt-4 block text-sm font-medium">
            Клинер
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
            onClick={onClose}
          >
            Отмена
          </button>
          <button
            type="button"
            disabled={assignMutation.isPending || cleaners.length === 0}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-50"
            onClick={submit}
          >
            {assignMutation.isPending ? 'Сохранение…' : 'Назначить'}
          </button>
        </div>
      </div>
    </div>
  )
}
