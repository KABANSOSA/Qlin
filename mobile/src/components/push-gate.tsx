import { usePushRegistration } from '@/hooks/usePushRegistration'

/** Подключает регистрацию пушей после авторизации. */
export function PushGate() {
  usePushRegistration()
  return null
}
