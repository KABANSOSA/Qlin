'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { api } from '@/lib/api'

export interface CrmUser {
  id: string
  phone: string
  email?: string
  role: string
}

export function useCrmAccess() {
  const router = useRouter()
  const [state, setState] = useState<{
    loading: boolean
    user: CrmUser | null
    error: 'network' | null
  }>({ loading: true, user: null, error: null })

  const load = useCallback(() => {
    if (typeof window === 'undefined') return
    const token = localStorage.getItem('access_token')
    if (!token) {
      setState({ loading: false, user: null, error: null })
      router.replace('/login')
      return
    }
    setState((s) => ({ ...s, loading: true, error: null }))
    api
      .get<CrmUser>('/auth/me')
      .then((r) => {
        if (r.data.role !== 'admin') {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          setState({ loading: false, user: null, error: null })
          router.replace('/login')
          return
        }
        setState({ loading: false, user: r.data, error: null })
      })
      .catch((err) => {
        if (axios.isAxiosError(err) && !err.response) {
          setState({ loading: false, user: null, error: 'network' })
          return
        }
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        setState({ loading: false, user: null, error: null })
        router.replace('/login')
      })
  }, [router])

  useEffect(() => {
    load()
  }, [load])

  return { ...state, retry: load }
}
