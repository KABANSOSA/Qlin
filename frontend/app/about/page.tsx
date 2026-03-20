'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Lightbulb, Target, Rocket, Heart, ArrowRight, Sparkles, CheckCircle } from 'lucide-react'

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden bg-hero-mesh">
        <div className="container relative mx-auto px-4 pb-16 pt-20 md:pb-24 md:pt-28">
          <div className="mx-auto max-w-3xl text-center animate-fade-in">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/90 px-4 py-2 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
              <span>О компании</span>
            </div>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl">О нас</h1>
            <p className="mt-6 text-balance text-lg text-muted-foreground md:text-xl">
              Мы пришли в клининг из опыта аренды и личных заказов — и хотели сервис без лишнего трения.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-card py-16 md:py-20">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="space-y-8">
            <Card className="border-border/70">
              <CardContent className="p-8 md:p-10">
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Lightbulb className="h-5 w-5" aria-hidden />
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Как всё начиналось</h2>
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
                  <blockquote className="rounded-xl border border-primary/15 bg-primary/5 px-5 py-4 text-foreground">
                    <p className="font-medium leading-relaxed">
                      В какой-то момент стало ясно: нам нужен сервис, которым мы сами хотели бы пользоваться каждый
                      день.
                    </p>
                  </blockquote>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardContent className="p-8 md:p-10">
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Target className="h-5 w-5" aria-hidden />
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Идея формата</h2>
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
                        className="flex flex-col items-center gap-2 rounded-xl border border-border/80 bg-surface-muted/50 px-4 py-4 text-center"
                      >
                        <CheckCircle className="h-5 w-5 text-primary" aria-hidden />
                        <p className="text-xs font-medium text-foreground">{t}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardContent className="p-8 md:p-10">
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Rocket className="h-5 w-5" aria-hidden />
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Продукт</h2>
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

            <Card className="border-primary/20 bg-primary text-primary-foreground shadow-elevated-lg">
              <CardContent className="p-8 md:p-10">
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground/15">
                    <Heart className="h-5 w-5" aria-hidden />
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Миссия</h2>
                </div>
                <p className="text-sm leading-relaxed text-primary-foreground/90 md:text-base">
                  Сделать чистоту доступной через технологичный, человечный сервис — без усложнения повседневности.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-14 text-center">
            <h3 className="text-xl font-semibold tracking-tight md:text-2xl">Попробуйте сервис</h3>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
              Оформите первый заказ и оцените качество на практике.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/orders/new">
                <Button size="lg" className="gap-2">
                  Заказать уборку
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </Link>
              <Link href="/">
                <Button size="lg" variant="outline">
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
