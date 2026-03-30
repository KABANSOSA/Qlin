import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Новый пароль | QLIN',
  description: 'Установите новый пароль по ссылке из письма.',
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
