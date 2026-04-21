'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart3,
  CheckSquare2,
  ClipboardList,
  CreditCard,
  Kanban,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/',          label: 'Обзор',    icon: BarChart3 },
  { href: '/orders',    label: 'Заявки',   icon: ClipboardList },
  { href: '/pipeline',  label: 'Воронка',  icon: Kanban },
  { href: '/sales',     label: 'Лиды',     icon: TrendingUp },
  { href: '/tasks',     label: 'Задачи',   icon: CheckSquare2, badge: true },
  { href: '/cleaners',  label: 'Клинеры',  icon: Sparkles },
  { href: '/contacts',  label: 'Контакты', icon: Users },
  { href: '/payments',  label: 'Оплаты',   icon: CreditCard },
  { href: '/admins',    label: 'Админы',   icon: ShieldCheck },
]

export type CrmShellCreateAction = {
  label?: string
  onClick: () => void
}

export type CrmShellHeaderSearch = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function CrmShell({
  children,
  mePhone,
  onRefresh,
  isFetching,
  createAction,
  headerSearch,
}: {
  children: React.ReactNode
  mePhone?: string
  onRefresh?: () => void
  isFetching?: boolean
  createAction?: CrmShellCreateAction
  headerSearch?: CrmShellHeaderSearch
}) {
  const pathname = usePathname()

  const { data: overdueCount = 0 } = useQuery({
    queryKey: ['crm-tasks-overdue-badge'],
    queryFn: async () => {
      const { data } = await api.get<{ id: string; deadline: string | null; status: string }[]>(
        '/admin/crm/tasks',
      )
      const now = new Date()
      return data.filter(
        (t) =>
          t.deadline &&
          t.status !== 'done' &&
          t.status !== 'cancelled' &&
          new Date(t.deadline) < now,
      ).length
    },
    enabled: !!mePhone,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })

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

  const phoneShort = mePhone?.replace(/\s/g, '') ?? ''

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      <header className="sticky top-0 z-20 border-b border-border bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1920px] flex-col gap-3 px-4 py-2.5 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="flex min-w-0 flex-1 items-center gap-6 lg:gap-8">
            <Link href="/" className="flex shrink-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-brand text-lg font-bold text-white shadow-sm">
                Q
              </div>
              <span className="hidden text-base font-bold tracking-tight text-foreground sm:block">
                QLIN CRM
              </span>
            </Link>

            <nav
              className="scrollbar-none flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto pb-0.5 text-sm font-medium lg:gap-1"
              aria-label="Разделы CRM"
            >
              {nav.map((item) => {
                const active = navActive(item.href)
                const Icon = item.icon
                const showBadge = item.badge && overdueCount > 0
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                      active
                        ? 'bg-brand/10 text-brand'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{item.label}</span>
                    {showBadge && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold text-white">
                        {overdueCount > 9 ? '9+' : overdueCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            {headerSearch && (
              <div className="relative hidden min-w-[200px] max-w-xs flex-1 md:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={headerSearch.value}
                  onChange={(e) => headerSearch.onChange(e.target.value)}
                  placeholder={headerSearch.placeholder ?? 'Поиск по CRM'}
                  className="h-9 w-full rounded-md border border-border bg-[#f5f6f8] pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-[#E31E24]/25"
                  aria-label="Поиск по CRM"
                />
              </div>
            )}

            {createAction && (
              <button
                type="button"
                onClick={createAction.onClick}
                className="inline-flex h-9 shrink-0 items-center rounded-md bg-brand px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-hover"
              >
                + {createAction.label ?? 'Создать'}
              </button>
            )}

            <div className="flex items-center gap-1 border-l border-border pl-2 sm:pl-3">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8eaed] text-xs font-semibold text-foreground"
                title={mePhone || 'Профиль'}
              >
                {phoneShort ? phoneShort.slice(-2) : '?'}
              </div>
            </div>

            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
                <span className="hidden sm:inline">Обновить</span>
              </button>
            )}
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
