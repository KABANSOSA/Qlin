/** Ключи совпадают с `extra_services` веб/мобильного заказа. */

const LABEL: Record<string, string> = {
  fridge: 'Помыть холодильник',
  microwave: 'Помыть СВЧ',
  oven: 'Помыть духовку',
  balcony_with_windows: 'Балкон (с окнами)',
  balcony_without_windows: 'Балкон (без окон)',
  cleaner_supplies: 'Средства клинера',
  windows: 'Окна',
  dishes: 'Посуда (шт.)',
  ironing: 'Глажка (шт.)',
  bedding_sets: 'Замена постельного (компл.)',
}

/**
 * Человекочитаемые строки по JSON из заказа.
 * Неизвестные ключи выводятся как «ключ: значение».
 */
export function describeExtraServices(raw: unknown): string[] {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return []
  const obj = raw as Record<string, unknown>
  const lines: string[] = []
  for (const [key, val] of Object.entries(obj)) {
    if (val === true) {
      lines.push(LABEL[key] ?? key)
      continue
    }
    if (typeof val === 'number' && Number.isFinite(val) && val !== 0) {
      const title = LABEL[key] ?? key
      lines.push(`${title}: ${val}`)
      continue
    }
    if (typeof val === 'string' && val.trim()) {
      const title = LABEL[key] ?? key
      lines.push(`${title}: ${val.trim()}`)
    }
  }
  return lines
}
