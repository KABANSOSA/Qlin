'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import axios from 'axios'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/protected-route'
import { useAuth } from '@/components/providers/auth-provider'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, MapPin } from 'lucide-react'
import { getOrderStatusClassName, getOrderStatusLabel } from '@/lib/order-status'

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
  const { loading: authLoading, user } = useAuth()
  const { error: toastError } = useToast()

  const payMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ confirmation_url: string }>(
        `/orders/${orderId}/payment/yookassa`,
      )
      return data.confirmation_url
    },
    onSuccess: (confirmationUrl) => {
      if (typeof window !== 'undefined' && confirmationUrl) {
        window.location.href = confirmationUrl
      }
    },
    onError: (err: unknown) => {
      const ax = err as { response?: { status?: number; data?: { detail?: string } } }
      const detail = ax.response?.data?.detail
      const msg =
        typeof detail === 'string'
          ? detail
          : ax.response?.status === 503
            ? 'Оплата не настроена на сервере (ЮKassa).'
            : 'Не удалось перейти к оплате.'
      toastError(msg, { title: 'Оплата' })
    },
  })

  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: ['order', orderId, user?.id],
    queryFn: async () => {
      const response = await api.get(`/orders/${orderId}`)
      return response.data
    },
    enabled: !!user && !!orderId,
    retry: 2,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-5xl px-4 py-10">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="mt-8 h-48 w-full rounded-2xl" />
          <Skeleton className="mt-6 h-96 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error || !order) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined
    const hint =
      status === 403
        ? 'Нет доступа к этому заказу.'
        : status === 404
          ? 'Заказ не найден.'
          : 'Не удалось загрузить или неверный идентификатор.'

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-5xl px-4 py-10">
          <Card className="card-tech-glow border-border/80">
            <CardContent className="p-10 text-center md:p-12">
              <h3 className="text-lg font-semibold">{status === 404 ? 'Заказ не найден' : 'Не удалось открыть заказ'}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button onClick={() => refetch()} variant="cta">
                  Повторить
                </Button>
                <Link href="/orders">
                  <Button variant="outline" className="w-full border-border/80 bg-background/80 sm:w-auto">
                    К списку
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <Link href="/orders">
          <Button variant="ghost" className="mb-6 -ml-2 gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            К заказам
          </Button>
        </Link>

        <Card className="card-tech-glow mb-6 overflow-hidden border-border/80 shadow-elevated">
          <div className="h-1 bg-gradient-to-r from-primary via-sky-500 to-cyan-500" />
          <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-start md:justify-between md:p-8">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-primary">Заказ · карточка</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-sm font-semibold text-primary ring-1 ring-primary/20">
                  #{order.order_number}
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Заказ #{order.order_number}</h1>
                  <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground md:text-base">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>{order.address}</span>
                  </p>
                </div>
              </div>
            </div>
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-4 py-1.5 text-sm font-semibold ${getOrderStatusClassName(order.status)}`}
            >
              {getOrderStatusLabel(String(order.status), 'detail')}
            </span>
          </CardContent>
        </Card>

        <Card className="card-tech-glow border-border/80">
          <CardHeader className="border-b border-border/60 bg-surface-muted/30 p-6 md:p-8">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-primary">Параметры · расчёт</p>
            <CardTitle className="mt-1 text-xl">Детали</CardTitle>
            <CardDescription>Параметры и стоимость</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6 md:p-8">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-card p-6">
                <h3 className="text-sm font-semibold text-foreground">Уборка</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4 border-b border-border/50 pb-3">
                    <dt className="text-muted-foreground">Тип</dt>
                    <dd className="font-semibold text-foreground">{getCleaningTypeLabel(order.cleaning_type)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-border/50 pb-3">
                    <dt className="text-muted-foreground">Комнат</dt>
                    <dd className="font-semibold">{order.rooms_count}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-border/50 pb-3">
                    <dt className="text-muted-foreground">Санузлов</dt>
                    <dd className="font-semibold">{order.bathrooms_count}</dd>
                  </div>
                  {order.area_sqm && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Площадь</dt>
                      <dd className="font-semibold">{order.area_sqm} м²</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card p-6">
                <h3 className="text-sm font-semibold text-foreground">Время</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4 border-b border-border/50 pb-3">
                    <dt className="text-muted-foreground">Запланировано</dt>
                    <dd className="text-right font-semibold">{formatDate(order.scheduled_at)}</dd>
                  </div>
                  {order.started_at && (
                    <div className="flex justify-between gap-4 border-b border-border/50 pb-3">
                      <dt className="text-muted-foreground">Начато</dt>
                      <dd className="text-right font-semibold">{formatDate(order.started_at)}</dd>
                    </div>
                  )}
                  {order.completed_at && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Завершено</dt>
                      <dd className="text-right font-semibold">{formatDate(order.completed_at)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-surface-muted/40 p-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <MapPin className="h-4 w-4 text-primary" aria-hidden />
                Адрес
              </h3>
              <p className="mt-2 font-medium text-foreground">{order.address}</p>
              {order.apartment && <p className="mt-1 text-sm text-muted-foreground">Кв. {order.apartment}</p>}
            </div>

            {order.special_instructions && (
              <div className="rounded-2xl border border-border/70 bg-card p-6">
                <h3 className="text-sm font-semibold">Комментарий</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{order.special_instructions}</p>
              </div>
            )}

            <div className="flex flex-col gap-4 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Итого</p>
                <p className="text-3xl font-semibold tabular-nums text-foreground md:text-4xl">{formatPrice(order.total_price)}</p>
              </div>
              {order.status === 'completed' && order.payment_status !== 'paid' && (
                <Button
                  size="lg"
                  variant="cta"
                  className="w-full sm:w-auto"
                  disabled={payMutation.isPending}
                  onClick={() => payMutation.mutate()}
                >
                  {payMutation.isPending ? 'Переход к оплате…' : 'Оплатить'}
                </Button>
              )}
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
