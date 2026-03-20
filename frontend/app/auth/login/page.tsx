'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LogIn, Phone, Lock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

const loginSchema = z.object({
  phone: z.string().min(10, 'Номер телефона должен содержать минимум 10 символов'),
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов'),
})

type LoginForm = z.infer<typeof loginSchema>

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || '/dashboard'
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
        const url = returnUrl.startsWith('/') ? returnUrl : `/${returnUrl}`
        window.location.href = url
      }, 500)
    } catch (err: any) {
      const isNetworkError = err.message === 'Network Error' || err.code === 'ERR_NETWORK'
      const errorMessage = isNetworkError
        ? 'Не удалось подключиться к серверу. Запустите бэкенд (docker-compose up -d backend) или проверьте NEXT_PUBLIC_API_URL в .env.'
        : (err.response?.data?.detail || 'Ошибка входа')
      setError(errorMessage)
      showError(errorMessage, { title: 'Ошибка входа' })
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-hero-mesh px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">QLIN</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Вход</h1>
          <p className="mt-2 text-sm text-muted-foreground">Телефон и пароль от вашего аккаунта</p>
        </div>

        <Card className="border-border/80 shadow-elevated-lg">
          <CardHeader className="space-y-2 border-b border-border/60 bg-surface-muted/30 p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <LogIn className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-lg md:text-xl">Аккаунт</CardTitle>
                <CardDescription>Данные для входа в личный кабинет</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-medium text-foreground">
                  Телефон
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input id="phone" type="tel" placeholder="+7 (999) 123-45-67" className="pl-10" {...register('phone')} />
                </div>
                {errors.phone && (
                  <p className="mt-2 text-sm text-destructive" role="alert">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">
                  Пароль
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input id="password" type="password" placeholder="••••••••" className="pl-10" {...register('password')} />
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-destructive" role="alert">
                    {errors.password.message}
                  </p>
                )}
                <div className="mt-2 text-right">
                  <Link href="/auth/forgot-password" className="text-sm font-medium text-primary hover:underline">
                    Забыли пароль?
                  </Link>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
                  {error}
                </div>
              )}

              <Button type="submit" className="h-12 w-full gap-2 text-base" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Вход…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Войти
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </span>
                )}
              </Button>

              <p className="border-t border-border/60 pt-6 text-center text-sm text-muted-foreground">
                Нет аккаунта?{' '}
                <Link href="/auth/register" className="font-semibold text-primary hover:underline">
                  Регистрация
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LoginPageFallback() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-hero-mesh px-4">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="mt-4 text-sm text-muted-foreground">Загрузка…</p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  )
}
