'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { CRM_ORDER_STAGES } from '@/lib/order-stages'
import { cn } from '@/lib/utils'

export function OrderStageSelect({
  orderId,
  status,
  compact,
}: {
  orderId: string
  status: string
  /** Компактный вид для карточек воронки */
  compact?: boolean
}) {
  const qc = useQueryClient()
  const [value, setValue] = useState(status)

  useEffect(() => {
    setValue(status)
  }, [status])

  const mut = useMutation({
    mutationFn: async (next: string) => {
      await api.patch(`/admin/orders/${orderId}/status`, { status: next })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      qc.invalidateQueries({ queryKey: ['admin-orders-pipeline'] })
    },
    onError: () => {
      setValue(status)
    },
  })

  const saving = mut.isPending
  const detail = (() => {
    const e = mut.error as { response?: { data?: { detail?: unknown } } } | undefined
    const d = e?.response?.data?.detail
    if (typeof d === 'string') return d
    if (d != null) return JSON.stringify(d)
    return null
  })()

  return (
    <div className={cn('flex flex-col gap-1', compact && 'w-full')}>
      <label className={cn('text-muted-foreground', compact ? 'text-[10px]' : 'text-xs')}>
        Этап
      </label>
      <select
        value={value}
        disabled={saving}
        onChange={(e) => {
          const next = e.target.value
          if (next === value) return
          const label = CRM_ORDER_STAGES.find((s) => s.value === next)?.label ?? next
          if (!window.confirm(`Перевести заказ в «${label}»?`)) {
            e.target.value = value
            return
          }
          setValue(next)
          mut.mutate(next)
        }}
        className={cn(
          'max-w-full rounded-md border border-border bg-white px-2 py-1.5 text-xs font-medium text-foreground',
          compact && 'py-1 text-[11px]',
        )}
      >
        {!CRM_ORDER_STAGES.some((s) => s.value === value) && (
          <option value={value}>Текущий: {value}</option>
        )}
        {CRM_ORDER_STAGES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {detail && <span className="text-[10px] leading-tight text-red-600">{detail}</span>}
    </div>
  )
}
