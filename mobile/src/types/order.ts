/** OrderResponse с API (JSON). */
export interface OrderDetail {
  id: string
  order_number: string
  customer_id: string
  cleaner_id?: string | null
  zone_id?: string | null
  address: string
  address_lat?: string | number | null
  address_lon?: string | number | null
  apartment?: string | null
  cleaning_type: string
  rooms_count: number
  bathrooms_count: number
  area_sqm?: string | number | null
  scheduled_at: string
  started_at?: string | null
  completed_at?: string | null
  base_price: string | number
  extra_services_price: string | number
  discount: string | number
  total_price: string | number
  status: string
  payment_status: string
  payment_method?: string | null
  created_at: string
  updated_at: string
  special_instructions?: string | null
}

export const ZONE_PLACEHOLDER = '00000000-0000-0000-0000-000000000000'
