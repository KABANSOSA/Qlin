'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export interface CrmUser {
  id: string
  phone: string
  email?: string
  role: string
}

export function useCrmAccess() {
  const router = useRouter()
  const [state, setState] = useState<{ loading: boolean; user: CrmUser | null }>({
    loading: true,
    user: null,
  })

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.replace('/login')
      return
    }
    api
      .get<CrmUser>('/auth/me')
      .then((r) => {
        if (r.data.role !== 'admin') {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          router.replace('/login')
          return
        }
        setState({ loading: false, user: r.data })
      })
      .catch(() => {
        router.replace('/login')
      })
  }, [router])

  return state
}
