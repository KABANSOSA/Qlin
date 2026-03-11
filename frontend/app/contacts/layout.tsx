import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Контакты',
  description: 'Свяжитесь с QLIN: телефон, email, Telegram. Москва, Южно-Сахалинск, Хабаровск. Работаем ежедневно с 9:00 до 21:00.',
}

export default function ContactsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
