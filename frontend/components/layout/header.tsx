'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

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
    <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors" aria-label="QLIN — на главную">
            QLIN
          </Link>

          <nav className="hidden md:flex items-center gap-6" aria-label="Основная навигация">
            <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
              Главная
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
              О нас
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
              Цены
            </Link>
            <Link href="/contacts" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
              Контакты
            </Link>
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                  Дашборд
                </Link>
                <Link href="/orders" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                  Заказы
                </Link>
                <Link href="/orders/new">
                  <Button className="gradient-primary text-white hover:shadow-lg transition-all">
                    Новый заказ
                  </Button>
                </Link>
                <Link href="/profile" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                  Профиль
                </Link>
                <Button variant="outline" onClick={handleLogout} className="hover:bg-gray-100">
                  Выйти
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="outline" className="hover:bg-gray-100">Войти</Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="gradient-primary text-white hover:shadow-lg transition-all">
                    Регистрация
                  </Button>
                </Link>
              </>
            )}
          </nav>

          <div className="md:hidden relative" ref={mobileMenuRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
              className="h-10 w-10"
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
                className="absolute right-0 top-full mt-2 w-64 rounded-xl border-2 border-gray-200 bg-white py-3 shadow-xl animate-fade-in"
                role="dialog"
                aria-label="Мобильное меню"
              >
                <Link href="/" className="block px-4 py-3 text-gray-700 hover:bg-gray-100 font-medium" onClick={closeMobileMenu}>
                  Главная
                </Link>
                <Link href="/about" className="block px-4 py-3 text-gray-700 hover:bg-gray-100 font-medium" onClick={closeMobileMenu}>
                  О нас
                </Link>
                <Link href="/pricing" className="block px-4 py-3 text-gray-700 hover:bg-gray-100 font-medium" onClick={closeMobileMenu}>
                  Цены
                </Link>
                <Link href="/contacts" className="block px-4 py-3 text-gray-700 hover:bg-gray-100 font-medium" onClick={closeMobileMenu}>
                  Контакты
                </Link>
                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard" className="block px-4 py-3 text-gray-700 hover:bg-gray-100 font-medium" onClick={closeMobileMenu}>
                      Дашборд
                    </Link>
                    <Link href="/orders" className="block px-4 py-3 text-gray-700 hover:bg-gray-100 font-medium" onClick={closeMobileMenu}>
                      Заказы
                    </Link>
                    <Link href="/orders/new" className="block px-4 py-3" onClick={closeMobileMenu}>
                      <span className="inline-block w-full rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-center font-semibold text-white">
                        Новый заказ
                      </span>
                    </Link>
                    <Link href="/profile" className="block px-4 py-3 text-gray-700 hover:bg-gray-100 font-medium" onClick={closeMobileMenu}>
                      Профиль
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 font-medium border-t border-gray-100 mt-2"
                    >
                      Выйти
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" className="block px-4 py-3 text-gray-700 hover:bg-gray-100 font-medium border-t border-gray-100" onClick={closeMobileMenu}>
                      Войти
                    </Link>
                    <Link href="/auth/register" className="block px-4 py-3" onClick={closeMobileMenu}>
                      <span className="inline-block w-full rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-center font-semibold text-white">
                        Регистрация
                      </span>
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
