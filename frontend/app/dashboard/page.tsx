'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ProtectedRoute } from '@/components/protected-route'
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatDate, formatPrice } from '@/lib/utils'

interface Order {
  id: string
  order_number: string
  address: string
  status: string
  total_price: string
  scheduled_at: string
}

interface Stats {
  total_orders: number
  completed_orders: number
  pending_orders: number
  total_spent: number
}

function DashboardContent() {
  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await api.get('/orders')
      return response.data
    },
  })

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Mock stats - replace with real API call
      return {
        total_orders: orders?.length || 0,
        completed_orders: orders?.filter(o => o.status === 'completed').length || 0,
        pending_orders: orders?.filter(o => ['pending', 'assigned', 'in_progress'].includes(o.status)).length || 0,
        total_spent: orders?.reduce((sum, o) => sum + parseFloat(o.total_price || '0'), 0) || 0,
      }
    },
    enabled: !!orders,
  })

  const recentOrders = orders?.slice(0, 5) || []
  const completionRate = stats ? (stats.completed_orders / stats.total_orders) * 100 : 0

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      paid: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: 'Ожидает',
      assigned: 'Назначен',
      in_progress: 'В работе',
      completed: 'Завершен',
      paid: 'Оплачен',
      cancelled: 'Отменен',
    }
    return texts[status] || status
  }

  if (ordersLoading || statsLoading) {
    return (
      <div className="container mx-auto p-4 py-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto p-4 py-8 max-w-7xl">
        {/* Hero Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-blue-200 mb-6">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Дашборд</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-gradient">
            Дашборд
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Обзор вашей активности и статистика заказов
          </p>
        </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card className="border-2 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-slide-up bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-600 font-medium">Всего заказов</CardDescription>
            <CardTitle className="text-4xl font-bold text-gradient">{stats?.total_orders || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="font-medium">Все время</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-slide-up bg-white/80 backdrop-blur-sm" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-600 font-medium">Завершено</CardDescription>
            <CardTitle className="text-4xl font-bold text-green-600">{stats?.completed_orders || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={completionRate} variant="success" showLabel />
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-slide-up bg-white/80 backdrop-blur-sm" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-600 font-medium">В работе</CardDescription>
            <CardTitle className="text-4xl font-bold text-blue-600">{stats?.pending_orders || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="font-medium">Активные заказы</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-slide-up gradient-primary text-white shadow-xl" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="pb-3">
            <CardDescription className="text-white/90 font-medium">Потрачено</CardDescription>
            <CardTitle className="text-4xl font-bold">{formatPrice(String(stats?.total_spent || 0))}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-white/80">
              <DollarSign className="h-5 w-5" />
              <span className="font-medium">Всего</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="border-2 shadow-2xl animate-fade-in bg-white/80 backdrop-blur-sm">
        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-blue-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold mb-2">Последние заказы</CardTitle>
              <CardDescription className="text-base">Ваши недавние заказы на уборку</CardDescription>
            </div>
            <Link href="/orders">
              <Button variant="outline" className="group border-2 hover:bg-blue-50 hover:border-blue-300 h-11">
                <span className="font-semibold">Все заказы</span>
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recentOrders.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">У вас пока нет заказов</p>
              <Link href="/orders/new">
                <Button className="gradient-primary text-white">
                  Создать первый заказ
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {recentOrders.map((order, index) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block p-6 hover:bg-gray-50 transition-colors group animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">
                          Заказ #{order.order_number}
                        </h3>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusText(order.status)}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-1">{order.address}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(order.scheduled_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {formatPrice(order.total_price)}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
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
      <DashboardContent />
    </ProtectedRoute>
  )
}
