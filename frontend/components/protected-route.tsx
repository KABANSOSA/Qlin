'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      const returnUrl = pathname ? `${pathname}` : '/dashboard'
      router.push(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`)
    } else {
      setIsAuthenticated(true)
    }
  }, [router, pathname])

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4 py-16">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
          <p className="text-sm text-muted-foreground">Проверка доступа…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
