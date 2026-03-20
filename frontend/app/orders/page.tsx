'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ProtectedRoute } from '@/components/protected-route'
import { Plus, ChevronRight } from 'lucide-react'
import { getOrderStatusClassName, getOrderStatusLabel } from '@/lib/order-status'

interface Order {
  id: string
  order_number: string
  address: string
  cleaning_type: string
  scheduled_at: string
  total_price: string
  status: string
  payment_status: string
}

function OrdersPageContent() {
  const { data: orders, isLoading, error, refetch } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await api.get('/orders')
      return response.data
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-7xl px-4 py-10">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="mt-3 h-5 w-full max-w-md" />
          <div className="mt-10 grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-hero-mesh px-4">
        <Card className="max-w-md text-center shadow-elevated-lg">
          <CardContent className="p-8">
            <p className="text-muted-foreground">Не удалось загрузить заказы</p>
            <Button className="mt-6" onClick={() => refetch()} variant="outline">
              Повторить
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getCleaningTypeLabel = (value: string) => {
    const labels: Record<string, string> = {
      regular: 'Обычная уборка',
      deep: 'Генеральная уборка',
      move_in: 'Уборка после ремонта',
      move_out: 'Уборка перед выездом',
    }
    return labels[value] || value
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/60 bg-hero-mesh">
        <div className="container mx-auto max-w-7xl px-4 py-12 md:flex md:items-end md:justify-between md:py-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Заказы</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Мои заказы</h1>
            <p className="mt-3 max-w-lg text-muted-foreground">История и статусы в одном списке.</p>
          </div>
          <Link href="/orders/new" className="mt-8 inline-block md:mt-0">
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" aria-hidden />
              Новый заказ
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-10">
        {!orders || orders.length === 0 ? (
          <Card className="border-border/70 border-dashed">
            <CardContent className="flex flex-col items-center px-6 py-16 text-center md:px-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Plus className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="mt-6 text-xl font-semibold">Пока нет заказов</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">Создайте первый — форма займёт пару минут.</p>
              <Link href="/orders/new" className="mt-8">
                <Button size="lg">Оформить уборку</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <Card key={order.id} className="border-border/70 transition-premium hover:border-primary/25 hover:shadow-elevated">
                <CardHeader className="flex flex-col gap-4 border-b border-border/60 p-6 sm:flex-row sm:items-start sm:justify-between md:p-8">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-lg md:text-xl">Заказ #{order.order_number}</CardTitle>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ${getOrderStatusClassName(order.status)}`}
                      >
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </div>
                    <CardDescription className="mt-2 text-base text-muted-foreground">{order.address}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-6 md:p-8">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-border/60 bg-surface-muted/40 px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Тип</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">{getCleaningTypeLabel(order.cleaning_type)}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-surface-muted/40 px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Время</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">{formatDate(order.scheduled_at)}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-surface-muted/40 px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Сумма</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">{formatPrice(order.total_price)}</p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline" className="w-full gap-2 sm:w-auto">
                        Подробнее
                        <ChevronRight className="h-4 w-4" aria-hidden />
                      </Button>
                    </Link>
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

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <OrdersPageContent />
    </ProtectedRoute>
  )
}
