import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ToastProvider } from '@/components/providers/toast-provider'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: {
    default: 'QLIN — Сервис уборки',
    template: '%s | QLIN',
  },
  description: 'Закажи уборку онлайн за 2 минуты. Профессиональная уборка квартир, прозрачные цены, проверенные уборщики. Москва, Южно-Сахалинск, Хабаровск.',
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <Providers>
          <ToastProvider>
            <a
              href="#main-content"
              className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:p-4 focus:w-auto focus:h-auto focus:m-0 focus:overflow-visible focus:[clip:auto] focus:bg-blue-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
            >
              Перейти к основному содержимому
            </a>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main id="main-content" className="flex-1" tabIndex={-1}>
                {children}
              </main>
              <Footer />
            </div>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  )
}
