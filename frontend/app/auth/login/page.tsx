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
import { LogIn, Phone, Lock, Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

const loginSchema = z.object({
  phone: z.string().min(10, 'Номер телефона должен содержать минимум 10 символов'),
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { success, error: showError } = useToast()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      setError(null)
      const response = await api.post('/auth/login', data)
      const { access_token, refresh_token } = response.data

      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)

      success('Вход выполнен успешно!', { title: 'Добро пожаловать' })
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 500)
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Ошибка входа'
      setError(errorMessage)
      showError(errorMessage, { title: 'Ошибка входа' })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      
      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-4">
            <Sparkles className="h-5 w-5 text-white" />
            <span className="text-sm font-medium text-white">QLIN</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Добро пожаловать
          </h1>
          <p className="text-blue-100">Войдите в свой аккаунт</p>
        </div>

        <Card className="border-2 shadow-2xl bg-white/95 backdrop-blur-sm animate-slide-up">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg p-6">
            <CardTitle className="text-2xl flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <LogIn className="h-6 w-6" />
              </div>
              Вход в систему
            </CardTitle>
            <CardDescription className="text-white/90 mt-2">
              Введите номер телефона и пароль для входа
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold mb-2 text-gray-700">
                  Номер телефона
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+7 (999) 123-45-67"
                    className="pl-10 h-12 border-2 focus:border-blue-500"
                    {...register('phone')}
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold mb-2 text-gray-700">
                  Пароль
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-12 border-2 focus:border-blue-500"
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.password.message}
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2 animate-slide-up">
                  <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-semibold gradient-primary text-white hover:shadow-xl transition-all duration-300 disabled:opacity-50" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Вход...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Войти
                    <ArrowRight className="h-5 w-5" />
                  </span>
                )}
              </Button>

              <div className="text-center pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Нет аккаунта?{' '}
                  <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
                    Зарегистрироваться
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
