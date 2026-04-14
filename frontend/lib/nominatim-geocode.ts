/**
 * Резервное геокодирование (без ключа Яндекс.Карт).
 * Политика Nominatim: не более ~1 req/s; для браузера — только по действию пользователя (выбор/пауза ввода).
 */

export type NominatimHit = {
  lat: number
  lon: number
  displayName: string
}

export async function geocodeNominatim(
  query: string,
  options?: { limit?: number; countrycodes?: string },
): Promise<NominatimHit[]> {
  const q = query.trim()
  if (q.length < 3) return []

  const params = new URLSearchParams({
    format: 'json',
    addressdetails: '0',
    limit: String(Math.min(10, Math.max(1, options?.limit ?? 5))),
    q,
  })
  if (options?.countrycodes) {
    params.set('countrycodes', options.countrycodes)
  }

  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  })
  if (!res.ok) {
    throw new Error(`nominatim_http_${res.status}`)
  }
  const rows = (await res.json()) as Array<{
    lat?: string
    lon?: string
    display_name?: string
  }>
  const out: NominatimHit[] = []
  for (const r of rows) {
    const lat = r.lat != null ? Number(r.lat) : NaN
    const lon = r.lon != null ? Number(r.lon) : NaN
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
    out.push({
      lat,
      lon,
      displayName: (r.display_name || q).trim(),
    })
  }
  return out
}
