import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Восстановление пароля',
  description: 'Восстановите доступ к аккаунту QLIN. Свяжитесь с нами по телефону или в Telegram.',
}

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
