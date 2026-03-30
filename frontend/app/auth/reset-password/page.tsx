'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Lock } from 'lucide-react'
import { AuthPageShell } from '@/components/layout/auth-page-shell'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

const schema = z
  .object({
    new_password: z.string().min(8, 'Минимум 8 символов'),
    confirm: z.string().min(8, 'Подтвердите пароль'),
  })
  .refine((d) => d.new_password === d.confirm, {
    message: 'Пароли не совпадают',
    path: ['confirm'],
  })

type Form = z.infer<typeof schema>

function ResetPasswordInner() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const { success, error: showError } = useToast()
  const [done, setDone] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: Form) => {
    if (!token) {
      showError('Нет токена в ссылке. Откройте ссылку из письма целиком.', { title: 'Ошибка' })
      return
    }
    try {
      await api.post('/auth/reset-password', {
        token,
        new_password: data.new_password,
      })
      setDone(true)
      success('Пароль обновлён. Можно войти.', { title: 'Готово' })
    } catch (err) {
      const ax = axios.isAxiosError(err)
      const detail = ax && err.response?.data?.detail
      showError(
        typeof detail === 'string'
          ? detail
          : 'Не удалось сменить пароль. Запросите новую ссылку.',
        { title: 'Ошибка' },
      )
    }
  }

  if (!token) {
    return (
      <AuthPageShell>
        <div className="mx-auto w-full max-w-md text-center">
          <Card className="card-tech-glow border-border/80 p-8">
            <p className="text-sm text-muted-foreground">
              Ссылка неполная. Откройте письмо и перейдите по кнопке «сброс пароля» ещё раз.
            </p>
            <Link href="/auth/forgot-password" className="mt-4 inline-block text-primary underline">
              Запросить письмо снова
            </Link>
          </Card>
        </div>
      </AuthPageShell>
    )
  }

  return (
    <AuthPageShell>
      <div className="mx-auto w-full max-w-md animate-fade-in">
        <div className="mb-6 text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
            Новый пароль
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
            <span className="text-gradient-headline">Установите пароль</span>
          </h1>
        </div>
        <Card className="card-tech-glow border-border/80 shadow-elevated-lg">
          <CardHeader className="space-y-3 border-b border-border/60 bg-surface-muted/30 p-6 md:p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
              <Lock className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <CardTitle className="text-xl md:text-2xl">Придумайте пароль</CardTitle>
              <CardDescription className="mt-2 text-base">
                Не короче 8 символов. После сохранения войдите на сайте с email или телефоном.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-6 md:p-8">
            {done ? (
              <Link href="/auth/login">
                <Button variant="cta" className="w-full">
                  Перейти ко входу
                </Button>
              </Link>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Новый пароль</label>
                  <Input type="password" autoComplete="new-password" className="h-11" {...register('new_password')} />
                  {errors.new_password && (
                    <p className="mt-1 text-xs text-destructive">{errors.new_password.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Повторите пароль</label>
                  <Input type="password" autoComplete="new-password" className="h-11" {...register('confirm')} />
                  {errors.confirm && (
                    <p className="mt-1 text-xs text-destructive">{errors.confirm.message}</p>
                  )}
                </div>
                <Button type="submit" variant="cta" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Сохранение…' : 'Сохранить пароль'}
                </Button>
              </form>
            )}
            <Link href="/auth/login">
              <Button variant="outline" className="w-full gap-2 border-border/80 bg-background/80">
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Назад ко входу
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </AuthPageShell>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  )
}
