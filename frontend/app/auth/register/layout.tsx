import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Регистрация',
  description: 'Создайте аккаунт QLIN — заказывайте уборку онлайн за 2 минуты.',
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
