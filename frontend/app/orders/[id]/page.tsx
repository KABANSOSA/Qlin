'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/protected-route'

const CLEANING_TYPE_LABELS: Record<string, string> = {
  regular: 'Обычная уборка',
  deep: 'Генеральная уборка',
  move_in: 'Уборка после ремонта',
  move_out: 'Уборка перед выездом',
}

function getCleaningTypeLabel(value: string) {
  return CLEANING_TYPE_LABELS[value] || value
}

function OrderDetailPageContent() {
  const params = useParams()
  const orderId = params.id as string

  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const response = await api.get(`/orders/${orderId}`)
      return response.data
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto p-4 py-8 max-w-5xl">
          <Skeleton className="h-10 w-40 mb-6" />
          <Skeleton className="h-32 w-full rounded-2xl mb-8" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto p-4 py-8 max-w-5xl">
          <Card className="border-2 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">Заказ не найден</h3>
              <p className="text-gray-500 mb-6">Заказ с таким ID не существует или не удалось загрузить данные</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => refetch()} variant="outline" size="lg">
                  Повторить
                </Button>
                <Link href="/orders">
                  <Button className="gradient-primary text-white hover:shadow-xl transition-all">
                    К списку заказов
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
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
      pending: 'Ожидает назначения',
      assigned: 'Назначен уборщику',
      in_progress: 'В работе',
      completed: 'Завершен',
      paid: 'Оплачен',
      cancelled: 'Отменен',
    }
    return texts[status] || status
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto p-4 py-8 max-w-5xl">
        {/* Hero Header */}
        <div className="mb-8 animate-fade-in">
          <Link href="/orders">
            <Button 
              variant="outline" 
              className="mb-6 border-2 hover:bg-blue-50 hover:border-blue-300"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад к заказам
            </Button>
          </Link>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border-2 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold">#{order.order_number}</span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold text-gradient">
                    Заказ #{order.order_number}
                  </h1>
                </div>
                <p className="text-lg text-gray-600 flex items-center gap-2">
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {order.address}
                </p>
              </div>
              <span
                className={`px-6 py-3 rounded-full text-base font-bold shadow-lg ${getStatusColor(
                  order.status
                )}`}
              >
                {getStatusText(order.status)}
              </span>
            </div>
          </div>
        </div>

        <Card className="border-2 shadow-xl bg-white/80 backdrop-blur-sm animate-slide-up">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg p-6">
            <CardTitle className="text-2xl flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              Детали заказа
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Детали уборки
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-blue-100">
                    <span className="text-gray-600 font-medium">Тип уборки:</span>
                    <span className="font-semibold">{getCleaningTypeLabel(order.cleaning_type)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-blue-100">
                    <span className="text-gray-600 font-medium">Комнат:</span>
                    <span className="font-semibold">{order.rooms_count}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-blue-100">
                    <span className="text-gray-600 font-medium">Санузлов:</span>
                    <span className="font-semibold">{order.bathrooms_count}</span>
                  </div>
                  {order.area_sqm && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">Площадь:</span>
                      <span className="font-semibold">{order.area_sqm} м²</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Время
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-green-100">
                    <span className="text-gray-600 font-medium">Запланировано:</span>
                    <span className="font-semibold">{formatDate(order.scheduled_at)}</span>
                  </div>
                  {order.started_at && (
                    <div className="flex justify-between items-center py-2 border-b border-green-100">
                      <span className="text-gray-600 font-medium">Начато:</span>
                      <span className="font-semibold">{formatDate(order.started_at)}</span>
                    </div>
                  )}
                  {order.completed_at && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">Завершено:</span>
                      <span className="font-semibold">{formatDate(order.completed_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Адрес
              </h3>
              <p className="text-base font-medium mb-2">{order.address}</p>
              {order.apartment && (
                <p className="text-sm text-gray-600">Квартира: {order.apartment}</p>
              )}
            </div>

            {order.special_instructions && (
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-6 rounded-xl border border-amber-100">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Особые указания
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">{order.special_instructions}</p>
              </div>
            )}

            <div className="border-t-2 pt-6 mt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1 font-medium">Итого</p>
                  <p className="text-4xl font-bold text-gradient">{formatPrice(order.total_price)}</p>
                </div>
                {order.status === 'completed' && order.payment_status !== 'paid' && (
                  <Button className="gradient-primary text-white hover:shadow-xl transition-all h-12 px-8 text-lg font-semibold">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Оплатить
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function OrderDetailPage() {
  return (
    <ProtectedRoute>
      <OrderDetailPageContent />
    </ProtectedRoute>
  )
}
