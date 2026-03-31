'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatPrice } from '@/lib/utils'
import { ProtectedRoute } from '@/components/protected-route'
import { Skeleton } from '@/components/ui/skeleton'
import { getOrderStatusClassName, getOrderStatusLabel } from '@/lib/order-status'
import { LayoutDashboard } from 'lucide-react'
import { AppPageHero } from '@/components/layout/app-page-hero'
import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'

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
  const { loading: authLoading, user } = useAuth()

  const { data: orders, isLoading, error, refetch } = useQuery<Order[]>({
    queryKey: ['admin-orders', user?.id],
    queryFn: async () => {
      const response = await api.get('/admin/orders')
      const data = response.data
      return Array.isArray(data) ? data : []
    },
    enabled: !!user && user.role === 'admin',
    retry: 1,
  })

  if (authLoading) {
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

  if (!user) {
    return null
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-7xl px-4 py-10">
          <Card className="card-tech-glow max-w-lg border-border/80 text-center shadow-elevated-lg">
            <CardContent className="p-10">
              <p className="text-sm text-muted-foreground">Эта страница доступна только администраторам.</p>
              <Link href="/dashboard" className="mt-6 inline-block">
                <Button variant="cta" size="lg">
                  В личный кабинет
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

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

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-7xl px-4 py-10">
          <Card className="card-tech-glow max-w-md border-border/80 text-center shadow-elevated-lg">
            <CardContent className="p-10">
              <p className="text-sm text-muted-foreground">Не удалось загрузить заказы.</p>
              <Button className="mt-6" type="button" variant="cta" onClick={() => refetch()}>
                Повторить
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AppPageHero
        eyebrow="Панель · администратор"
        title="Админ-панель"
        titleSize="default"
        gradientTitle={false}
        description="Сводка заказов (роль администратора)."
        leading={
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
            <LayoutDashboard className="h-5 w-5" aria-hidden />
          </div>
        }
      />

      <div className="container mx-auto max-w-7xl px-4 py-10">
        {!orders?.length ? (
          <Card className="card-tech-glow border-dashed">
            <CardContent className="py-16 text-center text-sm text-muted-foreground">Нет заказов для отображения</CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <Card key={order.id} className="card-tech-glow border-border/70 transition-[box-shadow] duration-300">
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
