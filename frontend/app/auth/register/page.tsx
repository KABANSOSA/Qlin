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
import { UserPlus, Phone, Mail, User, Lock, ArrowRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { AuthPageShell } from '@/components/layout/auth-page-shell'

const registerSchema = z
  .object({
    phone: z.string().min(10, 'Номер телефона должен содержать минимум 10 символов'),
    email: z.string().email('Неверный формат email').optional().or(z.literal('')),
    first_name: z.string().min(1, 'Имя обязательно').optional().or(z.literal('')),
    last_name: z.string().optional(),
    password: z.string().min(8, 'Пароль должен содержать минимум 8 символов'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
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
      await api.post('/auth/register', {
        phone: data.phone,
        email: data.email || undefined,
        first_name: data.first_name || undefined,
        last_name: data.last_name || undefined,
        password: data.password,
        telegram_id: null,
      })

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
      const isNetworkError = err.message === 'Network Error' || err.code === 'ERR_NETWORK'
      const errorMessage = isNetworkError
        ? 'Не удалось подключиться к серверу. Запустите бэкенд (например: docker-compose up -d backend) или проверьте NEXT_PUBLIC_API_URL в .env.'
        : (err.response?.data?.detail || err.message || 'Ошибка регистрации')
      console.error('Registration error:', err)
      const finalError = Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage
      setError(finalError)
      showError(finalError, { title: 'Ошибка регистрации' })
    }
  }

  return (
    <AuthPageShell align="start">
      <div className="mx-auto w-full max-w-lg animate-fade-in">
        <div className="mb-8 text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">QLIN · onboarding</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            <span className="text-gradient-headline">Регистрация</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Создайте аккаунт, чтобы оформлять уборку и видеть статусы в кабинете
          </p>
        </div>

        <Card className="card-tech-glow border-border/80 shadow-elevated-lg">
          <CardHeader className="space-y-2 border-b border-border/60 bg-surface-muted/30 p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
                <UserPlus className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-lg md:text-xl">Новый аккаунт</CardTitle>
                <CardDescription>Поля со звёздочкой обязательны</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-medium text-foreground">
                  Телефон *
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input id="phone" type="tel" placeholder="+7 …" className="pl-10" {...register('phone')} />
                </div>
                {errors.phone && (
                  <p className="mt-1.5 text-sm text-destructive" role="alert">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input id="email" type="email" placeholder="user@example.com" className="pl-10" {...register('email')} />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-sm text-destructive" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="first_name" className="mb-2 block text-sm font-medium text-foreground">
                    Имя
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                    <Input id="first_name" placeholder="Иван" className="pl-10" {...register('first_name')} />
                  </div>
                  {errors.first_name && <p className="mt-1.5 text-sm text-destructive">{errors.first_name.message}</p>}
                </div>
                <div>
                  <label htmlFor="last_name" className="mb-2 block text-sm font-medium text-foreground">
                    Фамилия
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                    <Input id="last_name" placeholder="Иванов" className="pl-10" {...register('last_name')} />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">
                  Пароль *
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input id="password" type="password" className="pl-10" {...register('password')} />
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-sm text-destructive" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-foreground">
                  Повтор пароля *
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input id="confirmPassword" type="password" className="pl-10" {...register('confirmPassword')} />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-sm text-destructive" role="alert">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
                  {error}
                </div>
              )}

              <Button type="submit" variant="cta" className="mt-2 h-12 w-full gap-2 text-base" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Создание…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Зарегистрироваться
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </span>
                )}
              </Button>

              <p className="border-t border-border/60 pt-6 text-center text-sm text-muted-foreground">
                Уже есть аккаунт?{' '}
                <Link href="/auth/login" className="font-semibold text-primary hover:underline">
                  Войти
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthPageShell>
  )
}
