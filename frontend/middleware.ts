import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Без no-store на HTML провайдеры/браузеры долго отдают старый документ → старые ссылки на JS → ошибки API на всех устройствах.
 * Auth по-прежнему в ProtectedRoute (client); middleware только выставляет заголовки.
 */
export function middleware(request: NextRequest) {
  const res = NextResponse.next()
  res.headers.set(
    'Cache-Control',
    'private, no-cache, no-store, max-age=0, must-revalidate',
  )
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
