'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatPrice } from '@/lib/utils'
import { ProtectedRoute } from '@/components/protected-route'
import { Skeleton } from '@/components/ui/skeleton'
import { getOrderStatusClassName, getOrderStatusLabel } from '@/lib/order-status'
import { LayoutDashboard } from 'lucide-react'

interface Order {
  id: string
  order_number: string
  address: string
  cleaning_type: string
  scheduled_at: string
  total_price: string
  status: string
  customer_id: string
  cleaner_id: string | null
}

function AdminPageContent() {
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const response = await api.get('/admin/orders')
      return response.data
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-7xl px-4 py-10">
          <Skeleton className="h-9 w-64" />
          <div className="mt-8 grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/60 bg-hero-mesh">
        <div className="container mx-auto max-w-7xl px-4 py-12 md:py-14">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <LayoutDashboard className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Админ-панель</h1>
              <p className="mt-1 text-muted-foreground">Сводка заказов (роль администратора)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-10">
        {!orders?.length ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center text-sm text-muted-foreground">Нет заказов для отображения</CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <Card key={order.id} className="border-border/70">
                <CardHeader className="flex flex-col gap-3 border-b border-border/60 p-6 sm:flex-row sm:items-start sm:justify-between md:p-8">
                  <div>
                    <CardTitle className="text-lg">Заказ #{order.order_number}</CardTitle>
                    <CardDescription className="mt-1 max-w-2xl">{order.address}</CardDescription>
                  </div>
                  <span
                    className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getOrderStatusClassName(order.status)}`}
                  >
                    {getOrderStatusLabel(order.status)}
                  </span>
                </CardHeader>
                <CardContent className="p-6 md:p-8">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Тип</p>
                      <p className="mt-1 text-sm font-semibold">{order.cleaning_type}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Время</p>
                      <p className="mt-1 text-sm font-semibold">{formatDate(order.scheduled_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Сумма</p>
                      <p className="mt-1 text-sm font-semibold tabular-nums">{formatPrice(order.total_price)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Уборщик</p>
                      <p className="mt-1 text-sm font-semibold">{order.cleaner_id ? 'Назначен' : 'Не назначен'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminPageContent />
    </ProtectedRoute>
  )
}
