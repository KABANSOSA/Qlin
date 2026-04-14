import type { UserMe } from '@/types/user'

/** Имя для приветствия */
export function greetingName(user: UserMe): string {
  const n = user.first_name?.trim()
  if (n) return n
  return 'Клиент'
}

export function cleanerGreetingName(user: UserMe): string {
  const n = user.first_name?.trim()
  if (n) return n
  return 'Клинер'
}

/** Инициалы для аватара */
export function userInitials(user: UserMe): string {
  const fn = user.first_name?.trim()
  const ln = user.last_name?.trim()
  if (fn && ln) return (fn[0] + ln[0]).toUpperCase()
  if (fn) return fn.slice(0, 2).toUpperCase()
  const digits = user.phone.replace(/\D/g, '')
  if (digits.length >= 2) return digits.slice(-2)
  return '?'
}

/** Коротко показать телефон */
export function phoneHint(phone: string): string {
  const d = phone.replace(/\D/g, '')
  if (d.length >= 4) return `···${d.slice(-4)}`
  return phone
}
