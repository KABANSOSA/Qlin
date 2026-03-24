/**
 * Базовый URL /api/v1 для запросов из браузера.
 * На проде всегда тот же origin, что и сайт (nginx проксирует /api → backend).
 * На localhost — NEXT_PUBLIC_API_URL или :8000.
 */
export function getApiV1Base(): string {
  if (typeof window === 'undefined') {
    const b = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    return `${b.replace(/\/$/, '')}/api/v1`
  }
  const h = window.location.hostname
  if (h === 'localhost' || h === '127.0.0.1') {
    const b = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    return `${b.replace(/\/$/, '')}/api/v1`
  }
  return `${window.location.origin}/api/v1`
}

/** Разбор detail из ответа FastAPI (строка или массив validation errors) */
export function formatApiErrorDetail(body: unknown): string {
  if (!body || typeof body !== 'object') return 'Ошибка запроса'
  const d = (body as { detail?: unknown }).detail
  if (typeof d === 'string') return d
  if (Array.isArray(d)) {
    return d
      .map((x) => (typeof x === 'object' && x && 'msg' in x ? String((x as { msg: string }).msg) : String(x)))
      .join(', ')
  }
  return 'Ошибка запроса'
}
