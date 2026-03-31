'use client'

import type { CrmUser } from '@/lib/use-crm-access'

export function CrmAccessBarrier({
  loading,
  user,
  error,
  retry,
}: {
  loading: boolean
  user: CrmUser | null
  error: 'network' | null
  retry: () => void
}) {
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (error === 'network') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <p className="max-w-md text-sm text-muted-foreground">
          Нет связи с API. Проверьте сеть; для CRM в CORS на бэкенде должен быть origin этой страницы.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95"
        >
          Повторить
        </button>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return null
}
