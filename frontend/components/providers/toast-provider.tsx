'use client'

import { useState, useCallback } from 'react'
import { createContext, useContext } from 'react'
import { ToastContainer } from '@/components/ui/toast'
import type { ToastProps } from '@/components/ui/toast'

let toastId = 0

interface ToastContextType {
  toasts: ToastProps[]
  addToast: (toast: Omit<ToastProps, 'id'>) => string
  removeToast: (id: string) => void
  toast: (description: string, options?: Omit<ToastProps, 'id' | 'description'>) => string
  success: (description: string, options?: Omit<ToastProps, 'id' | 'description' | 'variant'>) => string
  error: (description: string, options?: Omit<ToastProps, 'id' | 'description' | 'variant'>) => string
  warning: (description: string, options?: Omit<ToastProps, 'id' | 'description' | 'variant'>) => string
  info: (description: string, options?: Omit<ToastProps, 'id' | 'description' | 'variant'>) => string
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    // Return a no-op implementation if used outside provider
    return {
      toasts: [],
      addToast: () => '',
      removeToast: () => {},
      toast: () => '',
      success: () => '',
      error: () => '',
      warning: () => '',
      info: () => '',
    }
  }
  return context
}

function ToastContainerWrapper() {
  const { toasts, removeToast } = useToast()
  return <ToastContainer toasts={toasts} onRemove={removeToast} />
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const addToast = useCallback((toast: Omit<ToastProps, 'id'>) => {
    const id = `toast-${toastId++}`
    setToasts((prev) => [...prev, { ...toast, id }])
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const toast = useCallback(
    (description: string, options?: Omit<ToastProps, 'id' | 'description'>) => {
      return addToast({ description, ...options })
    },
    [addToast]
  )

  const success = useCallback(
    (description: string, options?: Omit<ToastProps, 'id' | 'description' | 'variant'>) => {
      return addToast({ description, variant: 'success', ...options })
    },
    [addToast]
  )

  const error = useCallback(
    (description: string, options?: Omit<ToastProps, 'id' | 'description' | 'variant'>) => {
      return addToast({ description, variant: 'error', ...options })
    },
    [addToast]
  )

  const warning = useCallback(
    (description: string, options?: Omit<ToastProps, 'id' | 'description' | 'variant'>) => {
      return addToast({ description, variant: 'warning', ...options })
    },
    [addToast]
  )

  const info = useCallback(
    (description: string, options?: Omit<ToastProps, 'id' | 'description' | 'variant'>) => {
      return addToast({ description, variant: 'info', ...options })
    },
    [addToast]
  )

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast, success, error, warning, info }}>
      {children}
      <ToastContainerWrapper />
    </ToastContext.Provider>
  )
}
