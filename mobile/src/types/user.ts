export interface UserMe {
  id: string
  phone: string
  email?: string | null
  first_name?: string | null
  last_name?: string | null
  role: string
  is_active: boolean
}
