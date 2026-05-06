import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Цены',
  description: 'Прозрачные цены на уборку квартир. Поддерживающая уборка от 3 500 ₽, дополнительные услуги. Без скрытых платежей.',
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
