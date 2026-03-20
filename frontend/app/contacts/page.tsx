'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, Mail, MapPin, ArrowRight, MessageCircle, Sparkles } from 'lucide-react'

export default function ContactsPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-hero-mesh">
        <div className="container relative mx-auto px-4 pb-16 pt-20 md:pb-20 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/90 px-4 py-2 text-xs font-medium text-muted-foreground shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
              <span>Поддержка</span>
            </div>
            <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">Контакты</h1>
            <p className="mt-4 text-lg text-muted-foreground md:text-xl">Выберите удобный канал — ответим в рабочие часы.</p>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/70 hover-lift-subtle">
            <CardHeader className="pb-4">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <CardTitle className="text-lg">Москва, Южно-Сахалинск</CardTitle>
                  <CardDescription>Единый номер</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface-muted/40 p-4">
                <Phone className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Телефон</p>
                  <a href="tel:+79621129483" className="text-lg font-semibold text-foreground transition-colors hover:text-primary">
                    8 (962) 112-94-83
                  </a>
                </div>
              </div>
              <a href="tel:+79621129483" className="inline-block w-full sm:w-auto">
                <Button type="button" className="w-full sm:w-auto">
                  Позвонить
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="border-border/70 hover-lift-subtle">
            <CardHeader className="pb-4">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <CardTitle className="text-lg">Хабаровск</CardTitle>
                  <CardDescription>Региональная линия</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface-muted/40 p-4">
                <Phone className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Телефон</p>
                  <a href="tel:+79140866545" className="text-lg font-semibold text-foreground transition-colors hover:text-primary">
                    8 (914) 086-65-45
                  </a>
                </div>
              </div>
              <a href="tel:+79140866545" className="inline-block w-full sm:w-auto">
                <Button type="button" className="w-full sm:w-auto">
                  Позвонить
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Card className="border-border/70 text-center">
            <CardHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Mail className="h-6 w-6" aria-hidden />
              </div>
              <CardTitle className="text-base">Email</CardTitle>
            </CardHeader>
            <CardContent>
              <a href="mailto:info@qlin.ru" className="text-sm font-medium text-primary hover:underline">
                info@qlin.ru
              </a>
            </CardContent>
          </Card>
          <Card className="border-border/70 text-center">
            <CardHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MessageCircle className="h-6 w-6" aria-hidden />
              </div>
              <CardTitle className="text-base">Telegram</CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href="https://t.me/CleaningRu_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:underline"
              >
                @CleaningRu_bot
              </a>
            </CardContent>
          </Card>
          <Card className="border-border/70 text-center">
            <CardHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Phone className="h-6 w-6" aria-hidden />
              </div>
              <CardTitle className="text-base">Режим</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-foreground">Ежедневно</p>
              <p className="text-sm text-muted-foreground">9:00 — 21:00</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-10 border-border/70">
          <CardHeader className="p-8 text-center md:p-10">
            <CardTitle className="text-xl md:text-2xl">Как с нами связаться</CardTitle>
            <CardDescription className="mx-auto max-w-xl text-base">
              Телефон для срочных вопросов, почта для документов, бот — для быстрых статусов.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 px-8 pb-8 md:grid-cols-2 md:px-10 md:pb-10">
            <div className="rounded-2xl border border-border/80 bg-surface-muted/40 p-6">
              <h3 className="font-semibold text-foreground">По телефону</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Позвоните в указанное время — поможем с заказом и уточнениями по адресу.
              </p>
              <p className="mt-4 text-xs text-muted-foreground">9:00 — 21:00, без выходных</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-surface-muted/40 p-6">
              <h3 className="font-semibold text-foreground">Через бота</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Уведомления и сценарии без потери контекста — удобно с мобильного.
              </p>
              <a
                href="https://t.me/CleaningRu_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
              >
                Открыть бота →
              </a>
            </div>
          </CardContent>
        </Card>

        <div className="mt-14 text-center">
          <h3 className="text-xl font-semibold md:text-2xl">Заказать уборку</h3>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">Онлайн-форма или консультация — как удобнее.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/orders/new">
              <Button size="lg" className="gap-2 px-8">
                Перейти к заказу
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline" className="px-8">
                На главную
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
