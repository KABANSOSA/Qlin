'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Calculator, ArrowRight, CheckCircle, Droplet, Shirt, Bed, Square, Sparkles } from 'lucide-react'

const addonIconClass = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-hero-mesh">
        <div className="container relative mx-auto px-4 pb-16 pt-20 md:pb-20 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/90 px-4 py-2 text-xs font-medium text-muted-foreground shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
              <span>Тарифы</span>
            </div>
            <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">Цены</h1>
            <p className="mt-4 text-lg text-muted-foreground md:text-xl">
              Публичные правила расчёта — как в калькуляторе заказа.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-5xl px-4 py-16 md:py-20">
        <Card className="overflow-hidden border-border/70 shadow-elevated-lg">
          <CardHeader className="space-y-0 border-b border-border/60 bg-surface-muted/80 p-8 md:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Home className="h-7 w-7" aria-hidden />
                </div>
                <div>
                  <CardTitle className="text-2xl md:text-3xl">Базовая уборка квартиры</CardTitle>
                  <CardDescription className="mt-2 text-base">До 50 м² — фиксированная база</CardDescription>
                </div>
              </div>
              <div className="text-left md:text-right">
                <p className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">3 300 ₽</p>
                <p className="text-sm text-muted-foreground">включая стандартный перечень работ</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 md:p-10">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                'Влажная уборка поверхностей',
                'Санузел и кухня',
                'Пылесос и мытьё полов',
                'Пыль с твёрдых поверхностей',
                'Вынос мусора',
                'Поверхности мебели — по доступу',
              ].map((t) => (
                <div key={t} className="flex gap-3 text-sm text-foreground/90">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <span>{t}</span>
                </div>
              ))}
            </div>
            <div className="mt-10 rounded-2xl border border-border/80 bg-surface-muted/50 p-6 md:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className={addonIconClass}>
                  <Calculator className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Площадь свыше 50 м²</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    + <span className="font-semibold text-foreground">30 ₽</span> за каждый дополнительный м²
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-16 md:mt-20">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Дополнительные услуги</h2>
            <p className="mt-3 text-muted-foreground">Добавляются к базе по вашему выбору.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                icon: Droplet,
                title: 'Мойка посуды',
                unit: 'за единицу',
                price: '10 ₽',
                desc: 'Поштучно, по согласованию в заказе',
              },
              {
                icon: Shirt,
                title: 'Глажка одежды',
                unit: 'за единицу',
                price: '70 ₽',
                desc: 'Аккуратная обработка вещей',
              },
              {
                icon: Bed,
                title: 'Смена постельного белья',
                unit: 'за комплект',
                price: '200 ₽',
                desc: 'Заправка и замена по запросу',
              },
              {
                icon: Square,
                title: 'Мойка окон',
                unit: 'за единицу',
                price: '150 ₽',
                desc: 'Стеклопакеты и рамы — в рамках заказа',
              },
            ].map((item) => (
              <Card key={item.title} className="border-border/70 hover-lift-subtle">
                <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-6">
                  <div className={addonIconClass}>
                    <item.icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>{item.unit}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-0">
                  <p className="text-3xl font-semibold tracking-tight text-foreground">{item.price}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="mt-16 border-border/70 md:mt-20">
          <CardHeader className="p-8 md:p-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className={addonIconClass}>
                <Calculator className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-xl md:text-2xl">Как считается итог</CardTitle>
                <CardDescription className="mt-2 text-base">Три слагаемых без «сюрпризов» в корзине.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-8 pb-8 pt-0 md:px-10 md:pb-10">
            {[
              {
                n: '1',
                title: 'База',
                body: 'Квартиры до 50 м² — 3 300 ₽ по текущему прайсу.',
              },
              {
                n: '2',
                title: 'Площадь',
                body: 'Свыше 50 м² добавляется 30 ₽ за каждый лишний м².',
                extra: 'Пример: 65 м² → 3 300 ₽ + (15 × 30 ₽) = 3 750 ₽',
              },
              {
                n: '3',
                title: 'Опции',
                body: 'Дополнительные услуги суммируются к базе, если вы их включили.',
              },
            ].map((step) => (
              <div
                key={step.n}
                className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-premium hover:border-primary/25"
              >
                <div className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                    {step.n}
                  </span>
                  <div>
                    <h3 className="font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                    {step.extra && (
                      <p className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">{step.extra}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="mt-16 text-center md:mt-20">
          <h3 className="text-xl font-semibold md:text-2xl">Готовы оформить?</h3>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Форма заказа учитывает эти правила при предварительном расчёте.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/orders/new">
              <Button size="lg" className="gap-2 px-8">
                Заказать уборку
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
