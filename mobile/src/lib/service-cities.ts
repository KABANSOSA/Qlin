/**
 * Города присутствия QLIN. Координаты — центр города для карты.
 */
export type ServiceCityId = 'khabarovsk' | 'yuzhno_sakhalinsk'

export const DEFAULT_SERVICE_CITY_ID: ServiceCityId = 'khabarovsk'

export type ServiceCity = {
  id: ServiceCityId
  /** Полное название для заказа и комментариев */
  name: string
  /** Коротко в UI */
  nameShort: string
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
  addressPlaceholder: string
}

export const SERVICE_CITIES: Record<ServiceCityId, ServiceCity> = {
  khabarovsk: {
    id: 'khabarovsk',
    name: 'Хабаровск',
    nameShort: 'Хабаровск',
    latitude: 48.4827,
    longitude: 135.0838,
    latitudeDelta: 0.07,
    longitudeDelta: 0.07,
    addressPlaceholder: 'Улица, дом, квартира — Хабаровск',
  },
  yuzhno_sakhalinsk: {
    id: 'yuzhno_sakhalinsk',
    name: 'Южно-Сахалинск',
    nameShort: 'Южно-Сахалинск',
    latitude: 46.9591,
    longitude: 142.738,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
    addressPlaceholder: 'Улица, дом, квартира — Южно-Сахалинск',
  },
}

export const SERVICE_CITY_IDS = Object.keys(SERVICE_CITIES) as ServiceCityId[]

/** Поле `service_city` в POST /orders (бэкенд → зона и тариф) */
export type ServiceCityApiKey = 'khabarovsk' | 'yuzhno_sakhalinsk'

export function serviceCityToApiKey(id: ServiceCityId): ServiceCityApiKey {
  return id === 'yuzhno_sakhalinsk' ? 'yuzhno_sakhalinsk' : 'khabarovsk'
}

export function parseServiceCityId(raw: string | undefined): ServiceCityId {
  return raw === 'yuzhno_sakhalinsk' ? 'yuzhno_sakhalinsk' : 'khabarovsk'
}

/** Короткий бренд-ряд под заголовком */
export const QLIN_REGION_TAGLINE = 'QLIN'

export const QLIN_CITIES_LINE = 'Уборка дома · Хабаровск и Южно-Сахалинск'
