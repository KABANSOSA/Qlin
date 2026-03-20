'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, KeyRound, Phone, MessageCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-hero-mesh px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="border-border/80 shadow-elevated-lg">
          <CardHeader className="space-y-3 border-b border-border/60 bg-surface-muted/30 p-6 md:p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <CardTitle className="text-xl md:text-2xl">Восстановление доступа</CardTitle>
              <CardDescription className="mt-2 text-base">
                Свяжитесь с поддержкой — подтвердим личность и поможем сбросить пароль.
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
            <Link href="/auth/login" className="block pt-2">
              <Button variant="outline" className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Назад ко входу
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
