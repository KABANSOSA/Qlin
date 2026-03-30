'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, KeyRound, Mail, Phone, MessageCircle } from 'lucide-react'
import { AuthPageShell } from '@/components/layout/auth-page-shell'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

const schema = z.object({
  email: z.string().min(1, 'Введите email').email('Некорректный email'),
})

type Form = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const { success, error: showError } = useToast()
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: Form) => {
    try {
      await api.post('/auth/forgot-password', { email: data.email.trim() })
      setSent(true)
      success('Если этот email есть в системе, мы отправили письмо со ссылкой.', {
        title: 'Проверьте почту',
      })
    } catch (err) {
      const ax = axios.isAxiosError(err)
      const detail = ax && err.response?.data?.detail
      const msg =
        typeof detail === 'string'
          ? detail
          : 'Не удалось отправить. Попробуйте позже или напишите в поддержку.'
      if (ax && err.response?.status === 503) {
        showError(
          'На сервере не настроена почта. Используйте поддержку ниже или обратитесь к администратору.',
          { title: 'Почта не настроена' },
        )
      } else {
        showError(msg, { title: 'Ошибка' })
      }
    }
  }

  return (
    <AuthPageShell>
      <div className="mx-auto w-full max-w-md animate-fade-in">
        <div className="mb-6 text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
            Восстановление доступа
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
            <span className="text-gradient-headline">Сброс пароля</span>
          </h1>
        </div>
        <Card className="card-tech-glow border-border/80 shadow-elevated-lg">
          <CardHeader className="space-y-3 border-b border-border/60 bg-surface-muted/30 p-6 md:p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
              <KeyRound className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <CardTitle className="text-xl md:text-2xl">По email</CardTitle>
              <CardDescription className="mt-2 text-base">
                Укажите email аккаунта — пришлём ссылку для нового пароля (действует 1 час).
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-6 md:p-8">
            {sent ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Проверьте папку «Входящие» и «Спам». Ссылка ведёт на страницу установки пароля.
              </p>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      autoComplete="email"
                      className="h-11 pl-10"
                      placeholder="you@example.com"
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <Button type="submit" variant="cta" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Отправка…' : 'Отправить ссылку'}
                </Button>
              </form>
            )}

            <div className="border-t border-border/60 pt-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Нет доступа к почте — поддержка
              </p>
              <div className="space-y-2">
                <a
                  href="tel:+79621129483"
                  className="flex items-center gap-3 rounded-xl border border-border/80 bg-card p-3 text-sm transition-colors hover:bg-muted/50"
                >
                  <Phone className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span className="font-medium">8 (962) 112-94-83</span>
                </a>
                <a
                  href="https://t.me/CleaningRu_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-border/80 bg-card p-3 text-sm transition-colors hover:bg-muted/50"
                >
                  <MessageCircle className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span className="font-medium">Telegram: @CleaningRu_bot</span>
                </a>
              </div>
            </div>

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
