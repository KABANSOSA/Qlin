'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ProtectedRoute } from '@/components/protected-route'
import { Calendar, Clock, DollarSign, AlertCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatDate, formatPrice } from '@/lib/utils'
import { DashboardErrorBoundary } from '@/components/dashboard-error-boundary'
import { getOrderStatusClassName, getOrderStatusLabel } from '@/lib/order-status'

interface Order {
  id: string
  order_number: string
  address: string
  status: string
  total_price: string
  scheduled_at: string
}

function DashboardContent() {
  const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await api.get('/orders')
      const data = response.data
      return Array.isArray(data) ? data : []
    },
  })

  const orders = Array.isArray(ordersData) ? ordersData : []
  const safeOrders = orders.filter((o): o is Order => o != null && typeof o === 'object')
  const recentOrders = safeOrders.slice(0, 5)
  const totalOrders = safeOrders.length
  const completedOrders = safeOrders.filter((o) => o.status === 'completed').length
  const pendingOrders = safeOrders.filter((o) => ['pending', 'assigned', 'in_progress'].includes(String(o.status))).length
  const totalSpent = safeOrders.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0)
  const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0

  if (ordersLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-10">
        <Skeleton className="mb-8 h-9 w-56" />
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  if (ordersError) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-hero-mesh px-4 py-16">
        <Card className="max-w-md border-border/80 text-center shadow-elevated-lg">
          <CardContent className="p-8 md:p-10">
            <AlertCircle className="mx-auto h-10 w-10 text-amber-600" aria-hidden />
            <h2 className="mt-4 text-lg font-semibold text-foreground">Не удалось загрузить данные</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Обновите страницу или попробуйте позже. Если ошибка повторяется, проверьте, что бэкенд запущен.
            </p>
            <Button className="mt-6" onClick={() => window.location.reload()} variant="outline" size="lg">
              Обновить
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/60 bg-hero-mesh">
        <div className="container mx-auto max-w-7xl px-4 py-12 md:py-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Личный кабинет</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Дашборд</h1>
          <p className="mt-3 max-w-xl text-muted-foreground md:text-lg">
            Краткий обзор заказов на основе ваших данных.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/70">
            <CardHeader className="pb-2">
              <CardDescription>Всего заказов</CardDescription>
              <CardTitle className="text-3xl font-semibold tabular-nums">{totalOrders}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">За всё время в аккаунте</p>
            </CardContent>
          </Card>
          <Card className="border-border/70">
            <CardHeader className="pb-2">
              <CardDescription>Завершено</CardDescription>
              <CardTitle className="text-3xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                {completedOrders}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={completionRate} variant="success" showLabel />
            </CardContent>
          </Card>
          <Card className="border-border/70">
            <CardHeader className="pb-2">
              <CardDescription>Активные</CardDescription>
              <CardTitle className="text-3xl font-semibold tabular-nums">{pendingOrders}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" aria-hidden />
              <span>В процессе или назначены</span>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-primary text-primary-foreground shadow-elevated">
            <CardHeader className="pb-2">
              <CardDescription className="text-primary-foreground/85">Сумма заказов</CardDescription>
              <CardTitle className="text-3xl font-semibold tabular-nums">{formatPrice(String(totalSpent))}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-sm text-primary-foreground/85">
              <DollarSign className="h-4 w-4 shrink-0" aria-hidden />
              <span>По данным истории</span>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/70 shadow-elevated">
          <CardHeader className="flex flex-col gap-4 border-b border-border/60 bg-surface-muted/30 p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
            <div>
              <CardTitle className="text-xl md:text-2xl">Последние заказы</CardTitle>
              <CardDescription className="mt-1">До пяти последних записей</CardDescription>
            </div>
            <Link href="/orders">
              <Button variant="outline" className="gap-2">
                Все заказы
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentOrders.length === 0 ? (
              <div className="px-6 py-16 text-center md:px-8">
                <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden />
                <p className="mt-4 text-muted-foreground">Заказов пока нет</p>
                <Link href="/orders/new" className="mt-6 inline-block">
                  <Button>Первый заказ</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {recentOrders.map((order) => (
                  <Link
                    key={order?.id}
                    href={`/orders/${order?.id ?? ''}`}
                    className="flex flex-col gap-4 px-6 py-5 transition-colors hover:bg-muted/40 md:flex-row md:items-center md:justify-between md:px-8"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground">#{order?.order_number ?? '—'}</span>
                        <Badge className={getOrderStatusClassName(String(order?.status ?? ''))}>
                          {getOrderStatusLabel(String(order?.status ?? ''))}
                        </Badge>
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{order?.address ?? '—'}</p>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" aria-hidden />
                          {formatDate(order?.scheduled_at)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" aria-hidden />
                          {formatPrice(order?.total_price)}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardErrorBoundary>
        <DashboardContent />
      </DashboardErrorBoundary>
    </ProtectedRoute>
  )
}
