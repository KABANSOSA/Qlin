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
      <div className="container mx-auto p-4 py-8">
        <div className="text-center">Загрузка...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
