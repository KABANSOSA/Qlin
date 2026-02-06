'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { UserPlus, Phone, Mail, User, Lock, Sparkles, ArrowRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const registerSchema = z.object({
  phone: z.string().min(10, 'Номер телефона должен содержать минимум 10 символов'),
  email: z.string().email('Неверный формат email').optional().or(z.literal('')),
  first_name: z.string().min(1, 'Имя обязательно').optional().or(z.literal('')),
  last_name: z.string().optional(),
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const { success, error: showError } = useToast()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError(null)
      const response = await api.post('/auth/register', {
        phone: data.phone,
        email: data.email || undefined,
        first_name: data.first_name || undefined,
        last_name: data.last_name || undefined,
        password: data.password,
        telegram_id: null,
      })

      // Auto login after registration
      const loginResponse = await api.post('/auth/login', {
        phone: data.phone,
        password: data.password,
      })

      const { access_token, refresh_token } = loginResponse.data
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)

      success('Регистрация прошла успешно!', { title: 'Добро пожаловать' })
      setTimeout(() => {
        router.push('/dashboard')
      }, 500)
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Ошибка регистрации'
      console.error('Registration error:', err)
      const finalError = Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage
      setError(finalError)
      showError(finalError, { title: 'Ошибка регистрации' })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* Logo/Brand - Compact */}
        <div className="text-center mb-6 sticky top-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 pb-4 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-3">
            <Sparkles className="h-4 w-4 text-white" />
            <span className="text-xs font-medium text-white">QLIN</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
            Создать аккаунт
          </h1>
          <p className="text-sm text-purple-100">Присоединяйтесь к тысячам довольных клиентов</p>
        </div>

        <Card className="border-2 shadow-2xl bg-white/95 backdrop-blur-sm animate-slide-up">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg p-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <UserPlus className="h-5 w-5" />
              </div>
              Регистрация
            </CardTitle>
            <CardDescription className="text-white/90 mt-1 text-sm">
              Создайте аккаунт для заказа уборки
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold mb-1.5 text-gray-700">
                  Номер телефона *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+7 (999) 123-45-67"
                    className="pl-10 h-11 border-2 focus:border-purple-500 text-sm"
                    {...register('phone')}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-1.5 text-gray-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    className="pl-10 h-11 border-2 focus:border-purple-500 text-sm"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-semibold mb-1.5 text-gray-700">
                    Имя
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="first_name"
                      placeholder="Иван"
                      className="pl-10 h-11 border-2 focus:border-purple-500 text-sm"
                      {...register('first_name')}
                    />
                  </div>
                  {errors.first_name && (
                    <p className="text-xs text-destructive mt-1.5">{errors.first_name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-semibold mb-1.5 text-gray-700">
                    Фамилия
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="last_name"
                      placeholder="Иванов"
                      className="pl-10 h-11 border-2 focus:border-purple-500 text-sm"
                      {...register('last_name')}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold mb-1.5 text-gray-700">
                  Пароль *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-11 border-2 focus:border-purple-500 text-sm"
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-1.5 text-gray-700">
                  Подтвердите пароль *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-11 border-2 focus:border-purple-500 text-sm"
                    {...register('confirmPassword')}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 p-3 rounded-lg flex items-center gap-2 animate-slide-up">
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-medium">{error}</span>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold gradient-secondary text-white hover:shadow-xl transition-all duration-300 disabled:opacity-50 mt-2" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Регистрация...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Зарегистрироваться
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>

              <div className="text-center pt-3 border-t">
                <p className="text-xs text-gray-600">
                  Уже есть аккаунт?{' '}
                  <Link href="/auth/login" className="text-purple-600 hover:text-purple-700 font-semibold hover:underline">
                    Войти
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
