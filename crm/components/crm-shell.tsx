'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, RefreshCw, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/', label: 'Обзор' },
  { href: '/orders', label: 'Заявки' },
  { href: '/pipeline', label: 'Воронка' },
  { href: '/contacts', label: 'Контакты' },
  { href: '/payments', label: 'Оплаты' },
]

export function CrmShell({
  children,
  mePhone,
  onRefresh,
  isFetching,
}: {
  children: React.ReactNode
  mePhone?: string
  onRefresh?: () => void
  isFetching?: boolean
}) {
  const pathname = usePathname()

  const navActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    const back = `${pathname}${typeof window !== 'undefined' ? window.location.search : ''}`
    window.location.href = `/login?returnUrl=${encodeURIComponent(back === '/login' ? '/' : back)}`
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ClipboardList className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <div className="text-sm font-semibold">QLIN CRM</div>
              <div className="text-xs text-muted-foreground">Заявки и клиенты</div>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-1 text-xs sm:gap-2 sm:text-sm" aria-label="Разделы CRM">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={navActive(item.href) ? 'page' : undefined}
                className={cn(
                  'rounded-lg px-2.5 py-1.5 font-medium transition-colors sm:px-3',
                  navActive(item.href)
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {mePhone && (
              <span className="hidden text-xs text-muted-foreground sm:inline">{mePhone}</span>
            )}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
                Обновить
              </button>
            )}
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              <LogOut className="h-3.5 w-3.5" />
              Выйти
            </button>
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
