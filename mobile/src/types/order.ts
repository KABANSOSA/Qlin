/** Соответствует OrderResponse бэкенда (поля приходят как JSON). */
export interface OrderRow {
  id: string
  order_number: string
  address: string
  status: string
  total_price: string | number
  scheduled_at: string
  cleaning_type: string
}
