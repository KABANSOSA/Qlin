'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ProtectedRoute } from '@/components/protected-route'

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto p-4 py-8 max-w-7xl">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-48 mx-auto mb-4" />
            <Skeleton className="h-8 w-96 mx-auto mb-2" />
            <Skeleton className="h-6 w-72 mx-auto" />
          </div>
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-lg text-gray-600 mb-4">Не удалось загрузить заказы</p>
          <Button onClick={() => refetch()} variant="outline" size="lg">
            Повторить
          </Button>
        </div>
      </div>
    )
  }

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto p-4 py-8 max-w-7xl">
        {/* Hero Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-blue-200 mb-6">
            <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-sm font-medium text-blue-600">Мои заказы</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-gradient">
            Мои заказы
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Все ваши заказы на уборку в одном месте
          </p>
          <Link href="/orders/new">
            <Button className="gradient-primary text-white hover:shadow-xl transition-all h-12 px-8 text-lg font-semibold">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Создать новый заказ
            </Button>
          </Link>
        </div>

      {!orders || orders.length === 0 ? (
        <Card className="border-2 shadow-2xl animate-fade-in bg-white/80 backdrop-blur-sm">
          <CardContent className="p-16 text-center">
            <div className="w-24 h-24 gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold mb-3 text-gradient">У вас пока нет заказов</h3>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              Создайте свой первый заказ на профессиональную уборку прямо сейчас
            </p>
            <Link href="/orders/new">
              <Button size="lg" className="gradient-primary text-white hover:shadow-xl transition-all h-14 px-8 text-lg font-semibold">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Создать первый заказ
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {orders.map((order, index) => (
            <Card key={order.id} className="border-2 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white/80 backdrop-blur-sm animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
              <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-blue-50 p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-sm">#{order.order_number}</span>
                      </div>
                      <CardTitle className="text-2xl font-bold">Заказ #{order.order_number}</CardTitle>
                    </div>
                    <CardDescription className="text-base flex items-center gap-2 mt-2">
                      <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {order.address}
                    </CardDescription>
                  </div>
                  <span
                    className={`px-5 py-2 rounded-full text-sm font-bold shadow-md ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusText(order.status)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <p className="text-xs text-gray-600 mb-1 font-medium uppercase tracking-wide">Тип уборки</p>
                    <p className="font-bold text-base">{getCleaningTypeLabel(order.cleaning_type)}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <p className="text-xs text-gray-600 mb-1 font-medium uppercase tracking-wide">Дата и время</p>
                    <p className="font-bold text-base">{formatDate(order.scheduled_at)}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <p className="text-xs text-gray-600 mb-1 font-medium uppercase tracking-wide">Стоимость</p>
                    <p className="font-bold text-xl text-gradient">{formatPrice(order.total_price)}</p>
                  </div>
                </div>
                         <div className="mt-6 pt-4 border-t border-gray-200/50 relative z-10">
                           <Link href={`/orders/${order.id}`}>
                             <Button variant="outline" className="group w-full sm:w-auto border-2 hover:bg-blue-50 hover:border-blue-400 h-12 rounded-xl font-bold transition-all duration-300 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg">
                               <span className="font-semibold">Подробнее</span>
                               <svg className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                               </svg>
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
