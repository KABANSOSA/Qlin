export const LEAD_STAGE_ORDER = ['new', 'contacted', 'qualified', 'lost'] as const
export const DEAL_STAGE_ORDER = ['discovery', 'proposal', 'negotiation', 'won', 'lost'] as const
export const TASK_STATUS_ORDER = ['todo', 'in_progress', 'done', 'cancelled'] as const

export const STAGE_LABEL: Record<string, string> = {
  new: 'Новый',
  contacted: 'Контакт',
  qualified: 'Квалификация',
  lost: 'Потерян',
  discovery: 'Выявление',
  proposal: 'Предложение',
  negotiation: 'Согласование',
  won: 'Выиграна',
}

// Tailwind классы для бейджей этапов
export const STAGE_BADGE: Record<string, string> = {
  new: 'bg-slate-100 text-slate-700',
  contacted: 'bg-blue-100 text-blue-700',
  qualified: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-red-100 text-red-700',
  discovery: 'bg-violet-100 text-violet-700',
  proposal: 'bg-amber-100 text-amber-700',
  negotiation: 'bg-orange-100 text-orange-700',
  won: 'bg-green-100 text-green-700',
}

export const TASK_STATUS_LABEL: Record<string, string> = {
  todo: 'Не начата',
  in_progress: 'В работе',
  done: 'Выполнена',
  cancelled: 'Отменена',
}

export const TASK_STATUS_BADGE: Record<string, string> = {
  todo: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export const SEGMENT_LABEL: Record<string, string> = {
  b2b: 'B2B',
  b2c: 'B2C',
}

export const KIND_LABEL: Record<string, string> = {
  lead: 'Лид',
  deal: 'Сделка',
}

export const SOURCE_LABEL: Record<string, string> = {
  website: 'Сайт',
  phone_call: 'Звонок',
  referral: 'Рекомендация',
  advertising: 'Реклама',
  social: 'Соцсети',
  other: 'Другое',
}

export const SOURCE_OPTIONS = [
  { value: 'website', label: 'Сайт' },
  { value: 'phone_call', label: 'Звонок' },
  { value: 'referral', label: 'Рекомендация' },
  { value: 'advertising', label: 'Реклама' },
  { value: 'social', label: 'Соцсети' },
  { value: 'other', label: 'Другое' },
]
