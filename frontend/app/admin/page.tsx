'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatPrice } from '@/lib/utils'
import { ProtectedRoute } from '@/components/protected-route'

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
    return <div className="container mx-auto p-4">Загрузка...</div>
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

  return (
    <div className="container mx-auto p-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Админ-панель</h1>

      <div className="grid gap-4">
        {orders?.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Заказ #{order.order_number}</CardTitle>
                  <CardDescription>{order.address}</CardDescription>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    order.status
                  )}`}
                >
                  {getStatusText(order.status)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Тип уборки</p>
                  <p className="font-medium">{order.cleaning_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Дата и время</p>
                  <p className="font-medium">{formatDate(order.scheduled_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Стоимость</p>
                  <p className="font-medium text-lg">{formatPrice(order.total_price)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Уборщик</p>
                  <p className="font-medium">
                    {order.cleaner_id ? 'Назначен' : 'Не назначен'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
