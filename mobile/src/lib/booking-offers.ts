/** Карточки типов уборки на главном экране (ориентиры по цене, не из API). */
export type CleaningValue = 'regular' | 'deep' | 'move_in' | 'move_out'

export const BOOKING_OFFERS: {
  value: CleaningValue
  title: string
  priceHint: string
  subtitle: string
}[] = [
  {
    value: 'regular',
    title: 'Базовая',
    priceHint: 'от 2 900 ₽',
    subtitle: 'Поддерживающая',
  },
  {
    value: 'deep',
    title: 'Генеральная',
    priceHint: 'от 5 900 ₽',
    subtitle: 'Глубокая уборка',
  },
  {
    value: 'move_in',
    title: 'После въезда',
    priceHint: 'от 8 900 ₽',
    subtitle: 'После ремонта',
  },
  {
    value: 'move_out',
    title: 'После выезда',
    priceHint: 'от 7 500 ₽',
    subtitle: 'Сдача объекта',
  },
]
