'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ProtectedRoute } from '@/components/protected-route'
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Edit, 
  Save, 
  Settings, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  DollarSign,
  Package,
  Award,
  Sparkles,
  ArrowRight,
  Shield,
  Bell
} from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatPrice } from '@/lib/utils'

const profileSchema = z.object({
  email: z.string().email('Неверный формат email').optional().or(z.literal('')),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

function ProfilePageContent() {
  const router = useRouter()
  const [success, setSuccess] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const response = await api.get('/users/me')
      return response.data
    },
  })

  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await api.get('/orders')
      return response.data
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: user ? {
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
    } : undefined,
  })

  useEffect(() => {
    if (user) {
      reset({
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
      })
    }
  }, [user, reset])

  const onSubmit = async (data: ProfileForm) => {
    try {
      await api.patch('/users/me', data)
      setSuccess(true)
      setIsEditing(false)
      refetch()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error('Error updating profile:', err)
    }
  }

  // Calculate stats
  const stats = {
    total_orders: orders?.length || 0,
    completed_orders: orders?.filter((o: any) => o.status === 'completed').length || 0,
    total_spent: orders?.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || '0'), 0) || 0,
    active_orders: orders?.filter((o: any) => ['pending', 'assigned', 'in_progress'].includes(o.status)).length || 0,
  }

  const completionRate = stats.total_orders > 0 ? (stats.completed_orders / stats.total_orders) * 100 : 0
  const memberSince = user ? new Date(user.created_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' }) : ''

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка профиля...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/auth/login')
    return null
  }

  const displayName = user.first_name && user.last_name 
    ? `${user.first_name} ${user.last_name}` 
    : user.first_name || user.phone || 'Пользователь'

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center text-5xl md:text-6xl font-bold shadow-2xl">
                  {user.first_name ? user.first_name[0].toUpperCase() : user.phone?.[0] || 'U'}
                </div>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-green-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-4">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-medium">Личный кабинет</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-2">
                  {displayName}
                </h1>
                <p className="text-xl text-blue-100 mb-4">
                  {user.email || user.phone}
                </p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <Badge className="bg-white/20 text-white border-white/30 px-4 py-1.5">
                    <Award className="w-4 h-4 mr-2" />
                    {stats.completed_orders} завершенных заказов
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/30 px-4 py-1.5">
                    <Calendar className="w-4 h-4 mr-2" />
                    С {memberSince}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12 md:py-16 -mt-10 relative z-10">
        <div className="max-w-6xl mx-auto">
          
          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-gray-600 font-medium">Всего заказов</CardDescription>
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <CardTitle className="text-3xl font-bold text-blue-600">{stats.total_orders}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span>Все время</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in bg-white" style={{ animationDelay: '0.1s' }}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-gray-600 font-medium">Завершено</CardDescription>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <CardTitle className="text-3xl font-bold text-green-600">{stats.completed_orders}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${completionRate}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">{completionRate.toFixed(0)}% успешных</p>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in bg-white" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-gray-600 font-medium">В работе</CardDescription>
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <CardTitle className="text-3xl font-bold text-purple-600">{stats.active_orders}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4 text-purple-500" />
                  <span>Активные</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in gradient-primary text-white" style={{ animationDelay: '0.3s' }}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-white/90 font-medium">Потрачено</CardDescription>
                  <DollarSign className="w-5 h-5" />
                </div>
                <CardTitle className="text-3xl font-bold">{formatPrice(String(stats.total_spent))}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <TrendingUp className="h-4 w-4" />
                  <span>Всего</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Profile Form */}
            <div className="md:col-span-2">
              <Card className="border-2 shadow-xl bg-white animate-fade-in">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900 mb-1">Личная информация</CardTitle>
                      <CardDescription>Управляйте своими данными</CardDescription>
                    </div>
                    {!isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Редактировать
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="first_name" className="block text-sm font-semibold mb-2 text-gray-700">
                          <User className="w-4 h-4 inline mr-2" />
                          Имя
                        </label>
                        <Input
                          id="first_name"
                          {...register('first_name')}
                          disabled={!isEditing}
                          className="h-11"
                        />
                      </div>

                      <div>
                        <label htmlFor="last_name" className="block text-sm font-semibold mb-2 text-gray-700">
                          <User className="w-4 h-4 inline mr-2" />
                          Фамилия
                        </label>
                        <Input
                          id="last_name"
                          {...register('last_name')}
                          disabled={!isEditing}
                          className="h-11"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-semibold mb-2 text-gray-700">
                        <Phone className="w-4 h-4 inline mr-2" />
                        Номер телефона
                      </label>
                      <Input
                        id="phone"
                        type="tel"
                        {...register('phone')}
                        disabled
                        className="h-11 bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">Номер телефона нельзя изменить</p>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold mb-2 text-gray-700">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        disabled={!isEditing}
                        className="h-11"
                      />
                      {errors.email && (
                        <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-semibold text-gray-700">Роль:</span>
                          <Badge className="ml-2 bg-blue-100 text-blue-800">
                            {user.role === 'customer' ? 'Клиент' : user.role}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Дата регистрации:</span>
                          <span className="ml-2 text-gray-600">
                            {new Date(user.created_at).toLocaleDateString('ru-RU', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {success && (
                      <div className="bg-green-50 border-2 border-green-200 text-green-800 p-4 rounded-lg flex items-center gap-2 animate-slide-up">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">Профиль успешно обновлен!</span>
                      </div>
                    )}

                    {isEditing && (
                      <div className="flex gap-3 pt-4 border-t">
                        <Button 
                          type="submit" 
                          disabled={isSubmitting}
                          className="flex-1 gradient-primary text-white hover:shadow-xl transition-all h-11 font-semibold"
                        >
                          {isSubmitting ? (
                            <span className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Сохранение...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Save className="w-4 h-4" />
                              Сохранить изменения
                            </span>
                          )}
                        </Button>
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false)
                            reset()
                          }}
                          className="h-11"
                        >
                          Отмена
                        </Button>
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <Card className="border-2 shadow-xl bg-white animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                  <CardTitle className="text-xl font-bold text-gray-900">Быстрые действия</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Link href="/orders/new">
                      <Button className="w-full justify-start gradient-primary text-white hover:shadow-lg transition-all h-11">
                        <Package className="w-4 h-4 mr-2" />
                        Новый заказ
                        <ArrowRight className="w-4 h-4 ml-auto" />
                      </Button>
                    </Link>
                    <Link href="/orders">
                      <Button variant="outline" className="w-full justify-start border-2 hover:bg-gray-50 h-11">
                        <Clock className="w-4 h-4 mr-2" />
                        Мои заказы
                        <ArrowRight className="w-4 h-4 ml-auto" />
                      </Button>
                    </Link>
                    <Link href="/dashboard">
                      <Button variant="outline" className="w-full justify-start border-2 hover:bg-gray-50 h-11">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Статистика
                        <ArrowRight className="w-4 h-4 ml-auto" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 shadow-xl bg-white animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                  <CardTitle className="text-xl font-bold text-gray-900">Безопасность</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Аккаунт защищен</p>
                        <p className="text-sm text-gray-600">Все данные в безопасности</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Bell className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Уведомления</p>
                        <p className="text-sm text-gray-600">Включены</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  )
}
