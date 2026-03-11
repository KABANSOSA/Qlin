import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Заказ',
  description: 'Детали заказа на уборку — QLIN.',
}

export default function OrderDetailLayout({ children }: { children: React.ReactNode }) {
  return children
}
