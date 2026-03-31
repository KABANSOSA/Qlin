/**
 * Публичный сайт (ЛК с заказами). CRM часто на crm.* или :3002 — ссылки ведут на основной домен.
 */
export function getPublicSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (typeof window !== 'undefined') {
    const h = window.location.hostname
    if (h === 'qlin.pro' || h === 'www.qlin.pro' || h.endsWith('.qlin.pro')) {
      return 'https://qlin.pro'
    }
  }
  return 'https://qlin.pro'
}

export function getPublicOrderUrl(orderId: string): string {
  return `${getPublicSiteUrl()}/orders/${orderId}`
}
