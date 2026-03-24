'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, Mail, MapPin, ArrowRight, MessageCircle, Headphones, Sparkles } from 'lucide-react'

export default function ContactsPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-hero-mesh">
        <div className="hero-spotlight pointer-events-none absolute inset-0" aria-hidden />
        <div
          className="tech-orb -left-24 top-16 h-64 w-64 animate-float-soft bg-primary/22"
          style={{ animationDelay: '-4s' }}
          aria-hidden
        />
        <div
          className="tech-orb -right-20 top-32 h-80 w-80 animate-float-soft bg-sky-400/18"
          style={{ animationDelay: '-9s' }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />

        <div className="container relative mx-auto px-4 pb-20 pt-20 md:pb-24 md:pt-28">
          <div className="mx-auto max-w-3xl text-center animate-fade-in">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 to-transparent px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              <Sparkles className="h-3.5 w-3.5 text-premium" aria-hidden />
              Каналы · поддержка
            </p>
            <div className="mx-auto mt-6 flex flex-wrap justify-center gap-2">
              {['Телефон', 'Email', 'Telegram'].map((label) => (
                <span key={label} className="glass-chip rounded-full px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {label}
                </span>
              ))}
            </div>
            <h1 className="mt-6 text-balance text-display-xl font-semibold tracking-tight">
              <span className="text-gradient-hero">Контакты</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground md:text-xl">Выберите удобный канал — ответим в рабочие часы.</p>
            <p className="mx-auto mt-6 max-w-xl font-mono text-[11px] leading-relaxed text-muted-foreground">
              <span className="text-primary">Ежедневно</span> 9:00 — 21:00
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="card-tech-glow border-border/70 hover-lift-subtle transition-[box-shadow,transform] duration-300">
            <CardHeader className="pb-4">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20">
                  <MapPin className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Регион · A</p>
                  <CardTitle className="text-lg">Москва, Южно-Сахалинск</CardTitle>
                  <CardDescription>Единый номер</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface-muted/40 p-4">
                <Phone className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Телефон</p>
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

          <Card className="card-tech-glow border-border/70 hover-lift-subtle transition-[box-shadow,transform] duration-300">
            <CardHeader className="pb-4">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20">
                  <MapPin className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Регион · B</p>
                  <CardTitle className="text-lg">Хабаровск</CardTitle>
                  <CardDescription>Региональная линия</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface-muted/40 p-4">
                <Phone className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Телефон</p>
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
          <Card className="card-tech-glow border-border/70 text-center transition-[box-shadow] duration-300">
            <CardHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-border/80">
                <Mail className="h-6 w-6" aria-hidden />
              </div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-primary">Почта</p>
              <CardTitle className="text-base">Email</CardTitle>
            </CardHeader>
            <CardContent>
              <a href="mailto:info@qlin.pro" className="text-sm font-medium text-primary hover:underline">
                info@qlin.pro
              </a>
            </CardContent>
          </Card>
          <Card className="card-tech-glow border-border/70 text-center transition-[box-shadow] duration-300">
            <CardHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-border/80">
                <MessageCircle className="h-6 w-6" aria-hidden />
              </div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-primary">Бот</p>
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
          <Card className="card-tech-glow border-border/70 text-center transition-[box-shadow] duration-300">
            <CardHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-border/80">
                <Headphones className="h-6 w-6" aria-hidden />
              </div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-primary">График</p>
              <CardTitle className="text-base">Режим</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-foreground">Ежедневно</p>
              <p className="text-sm text-muted-foreground">9:00 — 21:00</p>
            </CardContent>
          </Card>
        </div>

        <Card className="card-tech-glow mt-10 border-border/70">
          <CardHeader className="p-8 text-center md:p-10">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Куда писать</p>
            <CardTitle className="mt-3 text-xl md:text-2xl">Как с нами связаться</CardTitle>
            <CardDescription className="mx-auto max-w-xl text-base">
              Телефон для срочных вопросов, почта для документов, бот — для быстрых статусов.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 px-8 pb-8 md:grid-cols-2 md:px-10 md:pb-10">
            <div className="rounded-2xl border border-border/80 bg-surface-muted/40 p-6 ring-1 ring-border/40">
              <h3 className="font-semibold text-foreground">По телефону</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Позвоните в указанное время — поможем с заказом и уточнениями по адресу.
              </p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">9:00 — 21:00 · 7/7</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-surface-muted/40 p-6 ring-1 ring-border/40">
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

        <div className="relative mt-16 overflow-hidden rounded-3xl border border-white/10 bg-cta-premium px-6 py-14 text-center text-primary-foreground md:px-12 md:py-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
            aria-hidden
          />
          <div className="pointer-events-none absolute -right-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-white/10 blur-3xl" aria-hidden />
          <div className="relative">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-white/80">Заказ</p>
            <h3 className="mt-4 text-2xl font-semibold md:text-3xl">Уборка в пару кликов</h3>
            <p className="mx-auto mt-4 max-w-lg text-lg text-white/88">Онлайн-форма или консультация — как удобнее.</p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link href="/orders/new">
                <Button
                  size="lg"
                  variant="secondary"
                  className="btn-cta-shine h-14 gap-2 border-0 bg-white px-10 text-base font-semibold text-primary shadow-[0_20px_50px_-8px_rgba(0,0,0,0.35)] hover:bg-white/95"
                >
                  Перейти к заказу
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </Link>
              <Link href="/">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 border-white/35 bg-transparent px-8 text-primary-foreground hover:bg-white/10"
                >
                  На главную
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
