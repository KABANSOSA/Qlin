'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, Mail, MapPin, MessageCircle, Headphones } from 'lucide-react'

export default function ContactsPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border/70">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">Контакты</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">Свяжитесь с QLIN</h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
              Телефон для срочных вопросов, почта для документов, Telegram для быстрых сообщений.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">Ежедневно 9:00 — 21:00</p>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/80">
            <CardHeader className="pb-4">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground">
                  <MapPin className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Регион A</p>
                  <CardTitle className="text-lg">Москва, Южно-Сахалинск</CardTitle>
                  <CardDescription>Единый номер</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/40 p-4">
                <Phone className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Телефон</p>
                  <a href="tel:+79621129483" className="text-lg font-semibold text-foreground transition-colors hover:text-primary">
                    8 (962) 112-94-83
                  </a>
                </div>
              </div>
              <a href="tel:+79621129483" className="inline-block w-full sm:w-auto">
                <Button type="button" variant="cta" className="w-full sm:w-auto">
                  Позвонить
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardHeader className="pb-4">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground">
                  <MapPin className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Регион B</p>
                  <CardTitle className="text-lg">Хабаровск</CardTitle>
                  <CardDescription>Региональная линия</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/40 p-4">
                <Phone className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Телефон</p>
                  <a href="tel:+79140866545" className="text-lg font-semibold text-foreground transition-colors hover:text-primary">
                    8 (914) 086-65-45
                  </a>
                </div>
              </div>
              <a href="tel:+79140866545" className="inline-block w-full sm:w-auto">
                <Button type="button" variant="cta" className="w-full sm:w-auto">
                  Позвонить
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Card className="border-border/80 text-center">
            <CardHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-foreground">
                <Mail className="h-6 w-6" aria-hidden />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Почта</p>
              <CardTitle className="text-base">Email</CardTitle>
            </CardHeader>
            <CardContent>
              <a href="mailto:info@qlin.pro" className="text-sm font-medium text-primary hover:underline">
                info@qlin.pro
              </a>
            </CardContent>
          </Card>
          <Card className="border-border/80 text-center">
            <CardHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-foreground">
                <MessageCircle className="h-6 w-6" aria-hidden />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Бот</p>
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
          <Card className="border-border/80 text-center">
            <CardHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-foreground">
                <Headphones className="h-6 w-6" aria-hidden />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">График</p>
              <CardTitle className="text-base">Режим</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-foreground">Ежедневно</p>
              <p className="text-sm text-muted-foreground">9:00 — 21:00</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-10 border-border/80">
          <CardHeader className="p-8 text-center md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Куда писать</p>
            <CardTitle className="mt-3 text-xl md:text-2xl">Как с нами связаться</CardTitle>
            <CardDescription className="mx-auto max-w-xl text-base">
              Телефон для срочных вопросов, почта для документов, бот — для быстрых статусов.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 px-8 pb-8 md:grid-cols-2 md:px-10 md:pb-10">
            <div className="rounded-2xl border border-border/80 bg-muted/40 p-6">
              <h3 className="font-semibold text-foreground">По телефону</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Позвоните в указанное время — поможем с заказом и уточнениями по адресу.
              </p>
              <p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">9:00 — 21:00 · 7/7</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-muted/40 p-6">
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

        <Card className="mt-12 border-border/80">
          <CardContent className="flex flex-col items-center gap-6 p-8 text-center md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Заказ</p>
            <h3 className="text-2xl font-semibold md:text-3xl">Оформить уборку</h3>
            <p className="max-w-xl text-base text-muted-foreground">Выберите удобный формат: онлайн-форма или консультация.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/orders/new">
                <Button size="lg">Перейти к заказу</Button>
              </Link>
              <Link href="/">
                <Button size="lg" variant="outline">
                  На главную
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
