/** Человекочитаемые статусы заказа (как в CRM). */
export function orderStatusLabel(status: string): string {
  const m: Record<string, string> = {
    pending: 'Ожидает',
    assigned: 'Назначен',
    in_progress: 'В работе',
    completed: 'Выполнен',
    cancelled: 'Отменён',
    paid: 'Оплачен',
  }
  return m[status] ?? status
}

export function cleaningTypeLabel(t: string): string {
  const m: Record<string, string> = {
    regular: 'Генеральная / регулярная',
    deep: 'Глубокая',
    move_in: 'После переезда (въезд)',
    move_out: 'После переезда (выезд)',
  }
  return m[t] ?? t
}
