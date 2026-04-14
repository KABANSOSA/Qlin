/** Этапы воронки заказа в CRM (совпадают с backend). */
export const CRM_ORDER_STAGES = [
  { value: 'pending', label: 'Новый' },
  { value: 'assigned', label: 'Назначен' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'completed', label: 'Завершён' },
  { value: 'cancelled', label: 'Отменён' },
] as const

export type CrmOrderStage = (typeof CRM_ORDER_STAGES)[number]['value']
