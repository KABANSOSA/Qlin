'use client'

import { useQuery } from '@tanstack/react-query'
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
import { useAuth } from '@/components/providers/auth-provider'
import {
  User,
  Mail,
  Phone,
  Calendar,
  Edit,
  Save,
  CheckCircle,
  Clock,
  DollarSign,
  Package,
  ArrowRight,
  Shield,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'

const profileSchema = z.object({
  email: z.string().email('Неверный формат email').optional().or(z.literal('')),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

function ProfilePageContent() {
  const { loading: authLoading, user: authUser } = useAuth()
  const [success, setSuccess] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const { data: user, isLoading: profileLoading, isError: profileError, refetch } = useQuery({
    queryKey: ['user', 'me', authUser?.id],
    queryFn: async () => {
      const response = await api.get('/users/me')
      return response.data
    },
    enabled: !!authUser,
    staleTime: 30_000,
    retry: 2,
  })

  const { data: orders } = useQuery({
    queryKey: ['orders', authUser?.id],
    queryFn: async () => {
      const response = await api.get('/orders')
      const data = response.data
      return Array.isArray(data) ? data : []
    },
    enabled: !!authUser,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: user
      ? {
          email: user.email || '',
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          phone: user.phone || '',
        }
      : undefined,
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

  const stats = {
    total_orders: orders?.length || 0,
    completed_orders: orders?.filter((o: { status: string }) => o.status === 'completed').length || 0,
    total_spent: orders?.reduce((sum: number, o: { total_price?: string }) => sum + parseFloat(o.total_price || '0'), 0) || 0,
    active_orders: orders?.filter((o: { status: string }) => ['pending', 'assigned', 'in_progress'].includes(o.status)).length || 0,
  }

  const completionRate = stats.total_orders > 0 ? (stats.completed_orders / stats.total_orders) * 100 : 0
  const memberSince = user ? new Date(user.created_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' }) : ''

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Загрузка профиля…</p>
        </div>
      </div>
    )
  }

  if (profileError || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-background px-4">
        <Card className="card-tech-glow max-w-md border-border/80 text-center shadow-elevated-lg">
          <CardContent className="p-8">
            <p className="text-sm text-muted-foreground">Не удалось загрузить профиль.</p>
            <Button className="mt-6" type="button" variant="cta" onClick={() => refetch()}>
              Повторить
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const displayName =
    user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.first_name || user.phone || 'Пользователь'

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden border-b border-border/50 bg-hero-mesh">
        <div className="hero-spotlight pointer-events-none absolute inset-0" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />
        <div
          className="tech-orb -left-16 top-10 h-52 w-52 animate-float-soft bg-primary/20"
          style={{ animationDelay: '-5s' }}
          aria-hidden
        />
        <div
          className="tech-orb right-[-10%] top-20 h-64 w-64 animate-float-soft bg-sky-400/16"
          style={{ animationDelay: '-10s' }}
          aria-hidden
        />
        <div className="container relative mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="flex flex-col gap-8 md:flex-row md:items-center">
            <div className="relative mx-auto md:mx-0">
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-primary/30 bg-gradient-to-br from-card to-primary/5 text-3xl font-semibold shadow-[0_16px_48px_hsl(221_62%_45%/0.18)] ring-4 ring-background md:h-32 md:w-32 md:text-4xl">
                {user.first_name ? user.first_name[0].toUpperCase() : user.phone?.[0] || 'U'}
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-emerald-600 text-primary-foreground shadow-md">
                <CheckCircle className="h-4 w-4" aria-hidden />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 to-transparent px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                <Sparkles className="h-3 w-3 text-premium" aria-hidden />
                Аккаунт · профиль
              </p>
              <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
                <span className="text-gradient-headline">{displayName}</span>
              </h1>
              <p className="mt-2 text-muted-foreground">{user.email || user.phone}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
                <Badge variant="secondary" className="gap-1 font-normal">
                  <Package className="h-3.5 w-3.5" aria-hidden />
                  {stats.completed_orders} завершено
                </Badge>
                <Badge variant="outline" className="gap-1 font-normal">
                  <Calendar className="h-3.5 w-3.5" aria-hidden />
                  с {memberSince}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card className="card-tech-glow border-border/70 transition-[box-shadow] duration-300">
            <CardHeader className="pb-2">
              <CardDescription>Всего</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums">{stats.total_orders}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">Заказов в аккаунте</CardContent>
          </Card>
          <Card className="card-tech-glow border-border/70 transition-[box-shadow] duration-300">
            <CardHeader className="pb-2">
              <CardDescription>Завершено</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                {stats.completed_orders}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${completionRate}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{completionRate.toFixed(0)}% от всех</p>
            </CardContent>
          </Card>
          <Card className="card-tech-glow border-border/70 transition-[box-shadow] duration-300">
            <CardHeader className="pb-2">
              <CardDescription>Активные</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums">{stats.active_orders}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              В работе / ожидают
            </CardContent>
          </Card>
          <Card className="border-primary/25 bg-primary text-primary-foreground shadow-[0_12px_40px_hsl(221_62%_45%/0.22)] ring-1 ring-primary-foreground/10">
            <CardHeader className="pb-2">
              <CardDescription className="text-primary-foreground/85">Потрачено</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums">{formatPrice(String(stats.total_spent))}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-xs text-primary-foreground/85">
              <DollarSign className="h-3.5 w-3.5" aria-hidden />
              По суммам заказов
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="card-tech-glow border-border/70">
              <CardHeader className="flex flex-col gap-4 border-b border-border/60 bg-surface-muted/30 p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-primary">Редактирование</p>
                  <CardTitle className="mt-1 text-xl">Личные данные</CardTitle>
                  <CardDescription>Имя и почта (телефон фиксирован)</CardDescription>
                </div>
                {!isEditing && (
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4" aria-hidden />
                    Изменить
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-6 md:p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="first_name" className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <User className="h-4 w-4 text-muted-foreground" aria-hidden />
                        Имя
                      </label>
                      <Input id="first_name" {...register('first_name')} disabled={!isEditing} />
                    </div>
                    <div>
                      <label htmlFor="last_name" className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <User className="h-4 w-4 text-muted-foreground" aria-hidden />
                        Фамилия
                      </label>
                      <Input id="last_name" {...register('last_name')} disabled={!isEditing} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="phone" className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Phone className="h-4 w-4 text-muted-foreground" aria-hidden />
                      Телефон
                    </label>
                    <Input id="phone" type="tel" {...register('phone')} disabled className="bg-muted/50" />
                    <p className="mt-1 text-xs text-muted-foreground">Изменение телефона через поддержку</p>
                  </div>
                  <div>
                    <label htmlFor="email" className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Mail className="h-4 w-4 text-muted-foreground" aria-hidden />
                      Email
                    </label>
                    <Input id="email" type="email" {...register('email')} disabled={!isEditing} />
                    {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
                  </div>

                  <div className="rounded-xl border border-border/70 bg-surface-muted/40 p-4 text-sm">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <span className="text-muted-foreground">Роль</span>
                        <Badge className="ml-2" variant="secondary">
                          {user.role === 'customer' ? 'Клиент' : user.role}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Регистрация</span>
                        <p className="mt-1 font-medium">
                          {new Date(user.created_at).toLocaleDateString('ru-RU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {success && (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
                      <CheckCircle className="h-4 w-4 shrink-0" aria-hidden />
                      Сохранено
                    </div>
                  )}

                  {isEditing && (
                    <div className="flex flex-col gap-3 border-t border-border/60 pt-6 sm:flex-row">
                      <Button type="submit" disabled={isSubmitting} className="gap-2 sm:flex-1">
                        {isSubmitting ? (
                          'Сохранение…'
                        ) : (
                          <>
                            <Save className="h-4 w-4" aria-hidden />
                            Сохранить
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false)
                          reset()
                        }}
                      >
                        Отмена
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="card-tech-glow border-border/70">
              <CardHeader className="border-b border-border/60 p-6">
                <CardTitle className="text-lg">Действия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-4">
                <Link href="/orders/new" className="block">
                  <Button className="w-full justify-between gap-2" variant="cta">
                    Новый заказ
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Button>
                </Link>
                <Link href="/orders" className="block">
                  <Button className="w-full justify-between gap-2" variant="outline">
                    Заказы
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Button>
                </Link>
                <Link href="/dashboard" className="block">
                  <Button className="w-full justify-between gap-2" variant="outline">
                    Дашборд
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="card-tech-glow border-border/70">
              <CardHeader className="border-b border-border/60 p-6">
                <CardTitle className="text-lg">Безопасность</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
                    <Shield className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Данные аккаунта</p>
                    <p className="mt-1 text-xs text-muted-foreground">Используйте уникальный пароль и не передавайте коды входа.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
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
