'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function Header() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check authentication only on client side
    const token = localStorage.getItem('access_token')
    setIsAuthenticated(!!token)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setIsAuthenticated(false)
    router.push('/')
  }

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            QLIN
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
              Главная
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

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
