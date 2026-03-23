'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Calculator, ArrowRight, CheckCircle, Droplet, Shirt, Bed, Square, Sparkles } from 'lucide-react'

const addonIconClass =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-border/80'

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-hero-mesh">
        <div className="hero-spotlight pointer-events-none absolute inset-0" aria-hidden />
        <div
          className="tech-orb -left-20 top-20 h-64 w-64 animate-float-soft bg-primary/20"
          style={{ animationDelay: '-5s' }}
          aria-hidden
        />
        <div
          className="tech-orb -right-16 top-24 h-72 w-72 animate-float-soft bg-sky-400/16"
          style={{ animationDelay: '-10s' }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />

        <div className="container relative mx-auto px-4 pb-20 pt-20 md:pb-24 md:pt-28">
          <div className="mx-auto max-w-3xl text-center animate-fade-in">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 to-transparent px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              <Sparkles className="h-3.5 w-3.5 text-premium" aria-hidden />
              Прайс · калькулятор
            </p>
            <div className="mx-auto mt-6 flex flex-wrap justify-center gap-2">
              {['База 50 м²', '+30 ₽/м²', 'Опции'].map((label) => (
                <span key={label} className="glass-chip rounded-full px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {label}
                </span>
              ))}
            </div>
            <h1 className="mt-6 text-balance text-display-xl font-semibold tracking-tight">
              <span className="text-gradient-hero">Цены</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground md:text-xl">
              Публичные правила расчёта — видите ту же логику, что и в форме заказа.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-5xl px-4 py-16 md:py-20">
        <Card className="card-tech-glow overflow-hidden border-border/70 shadow-elevated-lg">
          <div className="h-1.5 bg-gradient-to-r from-primary via-sky-500 to-cyan-500" />
          <CardHeader className="space-y-0 border-b border-border/50 bg-surface-muted/80 p-8 md:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/25">
                  <Home className="h-7 w-7" aria-hidden />
                </div>
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-primary">Базовый тариф</p>
                  <CardTitle className="mt-1 text-2xl md:text-3xl">Базовая уборка квартиры</CardTitle>
                  <CardDescription className="mt-2 text-base">До 50 м² — фиксированная база</CardDescription>
                </div>
              </div>
              <div className="text-left md:text-right">
                <p className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl md:leading-none">3 300 ₽</p>
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
            <div className="mt-10 rounded-2xl border border-border/80 bg-gradient-to-br from-surface-muted/80 to-card p-6 ring-1 ring-border/40 md:p-8">
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

        <div className="relative mt-20 md:mt-24">
          <div className="pointer-events-none absolute inset-0 bg-tech-grid opacity-[0.22]" aria-hidden />
          <div className="relative mx-auto mb-12 max-w-2xl text-center">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">Дополнительно</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              <span className="text-gradient-headline">Услуги по запросу</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">Добавляются к базе — только то, что вы включили в заказ.</p>
          </div>
          <div className="relative grid gap-6 md:grid-cols-2">
            {[
              { icon: Droplet, title: 'Мойка посуды', unit: 'за единицу', price: '10 ₽', desc: 'Поштучно, по согласованию в заказе' },
              { icon: Shirt, title: 'Глажка одежды', unit: 'за единицу', price: '70 ₽', desc: 'Аккуратная обработка вещей' },
              { icon: Bed, title: 'Смена постельного белья', unit: 'за комплект', price: '200 ₽', desc: 'Заправка и замена по запросу' },
              { icon: Square, title: 'Мойка окон', unit: 'за единицу', price: '150 ₽', desc: 'Стеклопакеты и рамы — в рамках заказа' },
            ].map((item) => (
              <Card key={item.title} className="card-tech-glow border-border/70 hover-lift-subtle transition-[box-shadow,transform] duration-300">
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

        <Card className="card-tech-glow mt-16 border-border/70 md:mt-20">
          <CardHeader className="p-8 md:p-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className={addonIconClass}>
                <Calculator className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-primary">Формула</p>
                <CardTitle className="mt-1 text-xl md:text-2xl">Как считается итог</CardTitle>
                <CardDescription className="mt-2 text-base">Три слагаемых без «сюрпризов» в корзине.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-8 pb-8 pt-0 md:px-10 md:pb-10">
            {[
              { n: '1', title: 'База', body: 'Квартиры до 50 м² — 3 300 ₽ по текущему прайсу.' },
              {
                n: '2',
                title: 'Площадь',
                body: 'Свыше 50 м² добавляется 30 ₽ за каждый лишний м².',
                extra: 'Пример: 65 м² → 3 300 ₽ + (15 × 30 ₽) = 3 750 ₽',
              },
              { n: '3', title: 'Опции', body: 'Дополнительные услуги суммируются к базе, если вы их включили.' },
            ].map((step) => (
              <div
                key={step.n}
                className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm ring-1 ring-border/30 transition-premium hover:border-primary/30"
              >
                <div className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-sm font-semibold text-primary ring-1 ring-primary/15">
                    {step.n}
                  </span>
                  <div>
                    <h3 className="font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                    {'extra' in step && step.extra ? (
                      <p className="mt-3 rounded-lg bg-muted/60 px-3 py-2 font-mono text-xs text-muted-foreground">{step.extra}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="relative mt-20 overflow-hidden rounded-3xl border border-white/10 bg-cta-premium px-6 py-14 text-center text-primary-foreground md:mt-24 md:px-12 md:py-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
            aria-hidden
          />
          <div className="pointer-events-none absolute -left-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-white/10 blur-3xl" aria-hidden />
          <div className="relative">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-white/80">Оформление</p>
            <h3 className="mt-4 text-2xl font-semibold md:text-3xl">Готовы забронировать уборку?</h3>
            <p className="mx-auto mt-4 max-w-lg text-lg text-white/88">
              Форма заказа сразу учитывает эти правила — вы увидите ориентировочную сумму до отправки.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link href="/orders/new">
                <Button
                  size="lg"
                  variant="secondary"
                  className="btn-cta-shine h-14 gap-2 border-0 bg-white px-10 text-base font-semibold text-primary shadow-[0_20px_50px_-8px_rgba(0,0,0,0.35)] hover:bg-white/95"
                >
                  Заказать уборку
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </Link>
              <Link href="/">
                <Button size="lg" variant="outline" className="h-14 border-white/35 bg-transparent px-8 text-primary-foreground hover:bg-white/10">
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
