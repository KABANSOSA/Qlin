import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Цены',
  description: 'Прозрачные цены на уборку квартир. Базовая уборка от 3 300 ₽, дополнительные услуги. Без скрытых платежей.',
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
