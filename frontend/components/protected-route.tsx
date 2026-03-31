'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/providers/auth-provider'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { loading: authLoading, user } = useAuth()

  useEffect(() => {
    if (authLoading) return
    if (typeof window === 'undefined') return
    const token = localStorage.getItem('access_token')
    if (!user && !token) {
      const returnUrl = pathname ? `${pathname}` : '/dashboard'
      router.replace(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`)
    }
  }, [authLoading, user, pathname, router])

  if (authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4 py-16">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
          <p className="text-sm text-muted-foreground">Проверка доступа…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (!token) {
      return null
    }
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-hero-mesh px-4 py-16">
        <div className="max-w-md rounded-2xl border border-border/80 bg-card p-8 text-center shadow-elevated-lg">
          <p className="text-sm text-muted-foreground">
            Не удалось загрузить сессию. Проверьте соединение и обновите страницу.
          </p>
          <Button className="mt-6" type="button" variant="cta" size="lg" onClick={() => window.location.reload()}>
            Обновить
          </Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
