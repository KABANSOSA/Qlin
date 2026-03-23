'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, KeyRound, Phone, MessageCircle } from 'lucide-react'
import { AuthPageShell } from '@/components/layout/auth-page-shell'

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell>
      <div className="mx-auto w-full max-w-md animate-fade-in">
        <div className="mb-6 text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
            Поддержка · сброс пароля
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
            <span className="text-gradient-headline">Восстановление доступа</span>
          </h1>
        </div>
        <Card className="card-tech-glow border-border/80 shadow-elevated-lg">
          <CardHeader className="space-y-3 border-b border-border/60 bg-surface-muted/30 p-6 md:p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
              <KeyRound className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-primary">Инструкция</p>
              <CardTitle className="mt-2 text-xl md:text-2xl">Через поддержку</CardTitle>
              <CardDescription className="mt-2 text-base">
                Подтвердим личность и поможем сбросить пароль вручную.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-6 md:p-8">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Для безопасности аккаунта сброс выполняется вручную после короткой проверки.
            </p>
            <a
              href="tel:+79621129483"
              className="flex items-center gap-3 rounded-xl border border-border/80 bg-card p-4 transition-colors hover:bg-muted/50"
            >
              <Phone className="h-5 w-5 shrink-0 text-primary" aria-hidden />
              <span className="font-medium text-foreground">8 (962) 112-94-83</span>
            </a>
            <a
              href="https://t.me/CleaningRu_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-border/80 bg-card p-4 transition-colors hover:bg-muted/50"
            >
              <MessageCircle className="h-5 w-5 shrink-0 text-primary" aria-hidden />
              <span className="font-medium text-foreground">Telegram: @CleaningRu_bot</span>
            </a>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <a href="tel:+79621129483" className="block flex-1">
                <Button variant="cta" className="w-full">
                  Позвонить в поддержку
                </Button>
              </a>
              <Link href="/auth/login" className="block flex-1">
                <Button variant="outline" className="w-full gap-2 border-border/80 bg-background/80">
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  Назад ко входу
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthPageShell>
  )
}
