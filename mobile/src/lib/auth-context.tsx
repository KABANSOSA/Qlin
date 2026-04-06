import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import { api } from './api'
import type { UserMe } from '@/types/user'

interface AuthState {
  user: UserMe | null
  loading: boolean
  login: (phone: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserMe | null>(null)
  const [loading, setLoading] = useState(true)

  const loadSession = useCallback(async () => {
    const access = await SecureStore.getItemAsync('access_token')
    if (!access) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const { data } = await api.get<UserMe>('/auth/me')
      setUser(data)
    } catch {
      await SecureStore.deleteItemAsync('access_token')
      await SecureStore.deleteItemAsync('refresh_token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSession()
  }, [loadSession])

  const login = useCallback(async (phone: string, password: string) => {
    const { data } = await api.post<{ access_token: string; refresh_token: string }>('/auth/login', {
      phone: phone.trim(),
      password,
    })
    await SecureStore.setItemAsync('access_token', data.access_token)
    await SecureStore.setItemAsync('refresh_token', data.refresh_token)
    const { data: me } = await api.get<UserMe>('/auth/me')
    setUser(me)
  }, [])

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync('access_token')
    await SecureStore.deleteItemAsync('refresh_token')
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
    }),
    [user, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
