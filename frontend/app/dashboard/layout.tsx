import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Дашборд',
  description: 'Обзор заказов и статистика — личный кабинет QLIN.',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
