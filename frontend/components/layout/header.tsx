'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navLink =
  'text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-md focus-visible:ring-offset-2'

export function Header() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    setIsAuthenticated(!!token)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    if (mobileMenuOpen) {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [mobileMenuOpen])

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setIsAuthenticated(false)
    setMobileMenuOpen(false)
    router.push('/')
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between md:h-[4.25rem]">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-lg focus-visible:ring-offset-2"
            aria-label="QLIN — на главную"
          >
            QLIN
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Основная навигация">
            <Link href="/" className={cn(navLink, 'px-3 py-2')}>
              Главная
            </Link>
            <Link href="/about" className={cn(navLink, 'px-3 py-2')}>
              О нас
            </Link>
            <Link href="/pricing" className={cn(navLink, 'px-3 py-2')}>
              Цены
            </Link>
            <Link href="/contacts" className={cn(navLink, 'px-3 py-2')}>
              Контакты
            </Link>
            <span className="mx-2 h-4 w-px bg-border" aria-hidden />
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className={cn(navLink, 'px-3 py-2')}>
                  Дашборд
                </Link>
                <Link href="/orders" className={cn(navLink, 'px-3 py-2')}>
                  Заказы
                </Link>
                <Link href="/profile" className={cn(navLink, 'px-3 py-2')}>
                  Профиль
                </Link>
                <Link href="/orders/new" className="ml-2">
                  <Button size="sm">Новый заказ</Button>
                </Link>
                <Button variant="ghost" size="sm" className="ml-1" onClick={handleLogout}>
                  Выйти
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="ml-2">
                  <Button variant="ghost" size="sm">
                    Войти
                  </Button>
                </Link>
                <Link href="/auth/register" className="ml-1">
                  <Button size="sm">Регистрация</Button>
                </Link>
              </>
            )}
          </nav>

          <div className="relative md:hidden" ref={mobileMenuRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
              className="rounded-xl"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </Button>

            {mobileMenuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-[min(100vw-2rem,18rem)] rounded-2xl border border-border/80 bg-card p-2 shadow-elevated-lg animate-fade-in"
                role="dialog"
                aria-label="Мобильное меню"
              >
                {[
                  ['/', 'Главная'],
                  ['/about', 'О нас'],
                  ['/pricing', 'Цены'],
                  ['/contacts', 'Контакты'],
                ].map(([href, label]) => (
                  <Link
                    key={href}
                    href={href}
                    className="block rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/80"
                    onClick={closeMobileMenu}
                  >
                    {label}
                  </Link>
                ))}
                {isAuthenticated ? (
                  <>
                    <div className="my-2 border-t border-border/60" />
                    {[
                      ['/dashboard', 'Дашборд'],
                      ['/orders', 'Заказы'],
                      ['/profile', 'Профиль'],
                    ].map(([href, label]) => (
                      <Link
                        key={href}
                        href={href}
                        className="block rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/80"
                        onClick={closeMobileMenu}
                      >
                        {label}
                      </Link>
                    ))}
                    <Link href="/orders/new" className="block p-2" onClick={closeMobileMenu}>
                      <Button className="w-full" size="sm">
                        Новый заказ
                      </Button>
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-1 w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:bg-muted/80"
                    >
                      Выйти
                    </button>
                  </>
                ) : (
                  <>
                    <div className="my-2 border-t border-border/60" />
                    <Link href="/auth/login" className="block p-2" onClick={closeMobileMenu}>
                      <Button variant="outline" className="w-full" size="sm">
                        Войти
                      </Button>
                    </Link>
                    <Link href="/auth/register" className="block p-2 pt-0" onClick={closeMobileMenu}>
                      <Button className="w-full" size="sm">
                        Регистрация
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
