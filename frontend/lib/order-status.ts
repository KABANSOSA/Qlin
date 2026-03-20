/** Unified order status labels and styles for dashboard, orders, admin */

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает',
  assigned: 'Назначен',
  in_progress: 'В работе',
  completed: 'Завершён',
  paid: 'Оплачен',
  cancelled: 'Отменён',
}

/** Detail page uses slightly longer copy */
const STATUS_LABELS_DETAIL: Record<string, string> = {
  pending: 'Ожидает назначения',
  assigned: 'Назначен уборщику',
  in_progress: 'В работе',
  completed: 'Завершён',
  paid: 'Оплачен',
  cancelled: 'Отменён',
}

/** Balanced premium: soft backgrounds, readable contrast */
const STATUS_CLASSES: Record<string, string> = {
  pending:
    'bg-amber-50 text-amber-900 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-800',
  assigned:
    'bg-sky-50 text-sky-900 border border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-100 dark:border-sky-800',
  in_progress:
    'bg-violet-50 text-violet-900 border border-violet-200/80 dark:bg-violet-950/40 dark:text-violet-100 dark:border-violet-800',
  completed:
    'bg-emerald-50 text-emerald-900 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-800',
  paid:
    'bg-teal-50 text-teal-900 border border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-100 dark:border-teal-800',
  cancelled:
    'bg-red-50 text-red-900 border border-red-200/80 dark:bg-red-950/40 dark:text-red-100 dark:border-red-800',
}

const DEFAULT_CLASS =
  'bg-muted text-muted-foreground border border-border'

export function getOrderStatusLabel(status: string, variant: 'list' | 'detail' = 'list'): string {
  const map = variant === 'detail' ? STATUS_LABELS_DETAIL : STATUS_LABELS
  return map[status] ?? status
}

export function getOrderStatusClassName(status: string): string {
  return STATUS_CLASSES[status] ?? DEFAULT_CLASS
}
