'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Lightbulb, Target, Rocket, Heart, ArrowRight, CheckCircle, Sparkles } from 'lucide-react'

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden bg-hero-mesh">
        <div className="hero-spotlight pointer-events-none absolute inset-0" aria-hidden />
        <div className="tech-orb -left-28 top-12 h-72 w-72 animate-float-soft bg-primary/25" aria-hidden />
        <div
          className="tech-orb right-[-15%] top-28 h-80 w-80 animate-float-soft bg-sky-400/20"
          style={{ animationDelay: '-7s' }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />

        <div className="container relative mx-auto px-4 pb-20 pt-20 md:pb-28 md:pt-28">
          <div className="mx-auto max-w-3xl text-center animate-fade-in">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 to-transparent px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              <Sparkles className="h-3.5 w-3.5 text-premium" aria-hidden />
              История · продукт
            </p>
            <h1 className="mt-6 text-balance text-display-xl font-semibold tracking-tight">
              <span className="text-gradient-hero">О нас</span>
            </h1>
            <p className="mt-6 text-balance text-lg text-muted-foreground md:text-xl">
              Мы пришли в клининг из опыта аренды и личных заказов — и хотели сервис без лишнего трения.
            </p>
          </div>
        </div>
      </section>

      <section className="relative border-t border-border/40 bg-card py-20 md:py-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-tech-grid opacity-[0.18]" aria-hidden />
        <div className="container relative mx-auto max-w-3xl px-4">
          <div className="space-y-8">
            <Card className="card-tech-glow overflow-hidden border-border/70 transition-[box-shadow] duration-300">
              <div className="h-1 bg-gradient-to-r from-primary via-sky-500 to-cyan-500 opacity-90" />
              <CardContent className="p-8 md:p-10">
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20">
                    <Lightbulb className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Эпизод 01</p>
                    <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Как всё начиналось</h2>
                  </div>
                </div>
                <div className="space-y-5 text-sm leading-relaxed text-muted-foreground md:text-base">
                  <p className="text-foreground/90">
                    Несколько лет мы сдавали жильё и снова и снова упирались в одно: найти стабильный клининг с
                    предсказуемым качеством и сроками было непросто.
                  </p>
                  <p>
                    Заказывая уборку «для себя», мы сталкивались с тем же — длинные заявки, звонки, непрозрачные
                    условия.
                  </p>
                  <blockquote className="rounded-xl border border-primary/25 bg-primary/5 px-5 py-4 ring-1 ring-primary/10">
                    <p className="font-medium leading-relaxed text-foreground">
                      В какой-то момент стало ясно: нам нужен сервис, которым мы сами хотели бы пользоваться каждый
                      день.
                    </p>
                  </blockquote>
                </div>
              </CardContent>
            </Card>

            <Card className="card-tech-glow border-border/70 transition-[box-shadow] duration-300">
              <CardContent className="p-8 md:p-10">
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20">
                    <Target className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Эпизод 02</p>
                    <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Идея формата</h2>
                  </div>
                </div>
                <div className="space-y-5 text-sm leading-relaxed text-muted-foreground md:text-base">
                  <p>
                    Мы разбирали рынок и процессы конкурентов — и увидели, что можно сделать проще: меньше барьеров у
                    входа, больше ясности по цене и статусам.
                  </p>
                  <p className="text-foreground/90">
                    Философия простого заказа и понятного результата — как у лучших городских сервисов — легла в основу
                    продукта.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {['Без лишних звонков', 'Без скрытых условий', 'С понятным статусом'].map((t) => (
                      <div
                        key={t}
                        className="flex flex-col items-center gap-2 rounded-xl border border-border/80 bg-surface-muted/50 px-4 py-4 text-center ring-1 ring-border/40"
                      >
                        <CheckCircle className="mx-auto h-5 w-5 text-primary" aria-hidden />
                        <p className="text-xs font-medium text-foreground">{t}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-tech-glow border-border/70 transition-[box-shadow] duration-300">
              <CardContent className="p-8 md:p-10">
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20">
                    <Rocket className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Эпизод 03</p>
                    <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Продукт</h2>
                  </div>
                </div>
                <div className="space-y-5 text-sm leading-relaxed text-muted-foreground md:text-base">
                  <p>
                    Мы собрали заказ в несколько шагов, автоматизировали сценарии и связали сайт с ботом — чтобы не
                    терять контекст между каналами.
                  </p>
                  <p className="text-foreground/90">
                    Сегодня QLIN — это сервис, который ставит удобство клиента выше маркетингового шума.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-cta-premium text-primary-foreground shadow-[0_24px_60px_-12px_hsl(221_62%_35%/0.45)]">
              <div
                className="pointer-events-none absolute inset-0 opacity-25"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
                  backgroundSize: '32px 32px',
                }}
                aria-hidden
              />
              <CardContent className="relative p-8 md:p-10">
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                    <Heart className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-white/75">Миссия</p>
                    <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Что для нас важно</h2>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-white/90 md:text-base">
                  Сделать чистоту доступной через технологичный, человечный сервис — без усложнения повседневности.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="relative mt-16 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-surface-muted/90 to-card px-6 py-12 text-center shadow-elevated-lg md:px-10">
            <div className="pointer-events-none absolute inset-0 bg-tech-grid opacity-[0.25]" aria-hidden />
            <div className="relative">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Дальше</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
                <span className="text-gradient-headline">Попробуйте на деле</span>
              </h3>
              <p className="mx-auto mt-3 max-w-lg text-muted-foreground md:text-lg">
                Оформите первый заказ — и оцените сервис без обязательств на годы вперёд.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Link href="/orders/new">
                  <Button size="lg" variant="cta" className="h-14 gap-2 px-10 text-base">
                    Заказать уборку
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Button>
                </Link>
                <Link href="/">
                  <Button size="lg" variant="outline" className="h-14 border-border/80 bg-background/80 px-8 backdrop-blur-sm">
                    На главную
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
