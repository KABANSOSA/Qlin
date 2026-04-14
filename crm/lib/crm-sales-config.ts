export const LEAD_STAGE_ORDER = ['new', 'contacted', 'qualified', 'lost'] as const
export const DEAL_STAGE_ORDER = ['discovery', 'proposal', 'negotiation', 'won', 'lost'] as const

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

export const SEGMENT_LABEL: Record<string, string> = {
  b2b: 'B2B',
  b2c: 'B2C',
}

export const KIND_LABEL: Record<string, string> = {
  lead: 'Лид',
  deal: 'Сделка',
}
