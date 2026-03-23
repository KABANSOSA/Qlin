'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Zap,
  Shield,
  CreditCard,
  CheckCircle,
  ArrowRight,
  MapPin,
  LayoutDashboard,
  Radio,
  Timer,
  BadgeCheck,
  Sparkles,
} from 'lucide-react'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    setIsAuthenticated(!!token)
  }, [])

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden bg-hero-mesh">
        <div
          className="tech-orb -left-32 top-16 h-[22rem] w-[22rem] animate-float-soft bg-primary/30"
          style={{ animationDelay: '0s' }}
          aria-hidden
        />
        <div
          className="tech-orb right-[-18%] top-32 h-[28rem] w-[28rem] animate-float-soft bg-sky-400/25"
          style={{ animationDelay: '-6s' }}
          aria-hidden
        />
        <div
          className="tech-orb bottom-8 left-[20%] h-72 w-72 bg-cyan-500/15 opacity-50 blur-[88px]"
          aria-hidden
        />

        <div className="hero-spotlight pointer-events-none absolute inset-0" aria-hidden />

        <div className="container relative mx-auto px-4 pb-24 pt-20 md:pb-32 md:pt-28">
          <div className="mx-auto max-w-4xl text-center animate-fade-in">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-primary shadow-sm backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-premium" aria-hidden />
              Уборка под ключ · онлайн
            </div>

            <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
              {[
                { icon: MapPin, label: 'Адрес на карте' },
                { icon: LayoutDashboard, label: 'Личный кабинет' },
                { icon: Radio, label: 'Статусы онлайн' },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="glass-chip inline-flex items-center gap-2 rounded-full px-3.5 py-2 font-mono text-[11px] font-medium text-foreground/85"
                >
                  <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
                  {label}
                </span>
              ))}
            </div>

            <h1 className="text-balance font-semibold tracking-tight text-display-xl">
              <span className="text-gradient-hero">Чистота без лишних шагов</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground md:text-xl md:leading-relaxed">
              Закажите уборку как сервис с доставкой: укажите адрес и время — ориентировочная сумма сразу, статусы и
              история в кабинете. Без бесконечных звонков.
            </p>

            <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { icon: Timer, t: '~2 минуты', d: 'до отправки заявки' },
                { icon: BadgeCheck, t: 'Прозрачно', d: 'правила цены на сайте' },
                { icon: MapPin, t: '3 города', d: 'Мск, Юж.-Сах., Хабаровск' },
              ].map(({ icon: Icon, t, d }) => (
                <div
                  key={t}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/90 px-4 py-3 text-left shadow-sm backdrop-blur-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/15">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t}</p>
                    <p className="text-xs text-muted-foreground">{d}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
              <Link href="/orders/new">
                <Button size="lg" variant="cta" className="h-14 gap-2 px-10 text-base">
                  Заказать уборку
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </Link>
              {!isAuthenticated && (
                <Link href="/auth/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 border-border/80 bg-background/80 px-8 text-base shadow-sm backdrop-blur-md hover:bg-background"
                  >
                    Войти в кабинет
                  </Button>
                </Link>
              )}
            </div>

            <p className="mx-auto mt-10 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Никаких «5 000 отзывов» — только ваш реальный опыт после регистрации. Поддержка по телефону и в Telegram,
              когда нужно человеку.
            </p>
          </div>
        </div>
      </section>

      <section className="relative border-t border-border/40 bg-card py-20 md:py-28">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">Почему выбирают QLIN</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Сервис, который <span className="text-gradient-headline">не тормозит</span> ваш день
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Скорость оформления, предсказуемый процесс и понятная оплата — без мусора в интерфейсе.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-5 md:gap-6 lg:grid-cols-3 lg:grid-rows-2">
            <Card className="card-tech-glow group hover-lift-subtle relative overflow-hidden border-border/70 transition-[box-shadow,transform] duration-300 lg:col-span-2 lg:row-span-2">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-sky-500 to-cyan-500 opacity-90" />
              <CardHeader className="pb-2 pt-8">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/25">
                    <Zap className="h-6 w-6" aria-hidden />
                  </div>
                  <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                    Шаг 01 · поток заказа
                  </span>
                </div>
                <CardTitle className="text-2xl md:text-3xl">Быстро</CardTitle>
                <CardDescription className="text-base">Минимум полей — максимум ясности.</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-[15px] leading-relaxed text-muted-foreground md:text-base">
                  Форма ведёт по шагам: адрес на карте, параметры уборки, слот времени. Ориентировочная стоимость видна до
                  подтверждения — как в нормальном приложении, а не в Excel-таблице.
                </p>
              </CardContent>
            </Card>

            <Card className="card-tech-glow hover-lift-subtle border-border/70 transition-[box-shadow,transform] duration-300 lg:col-span-1">
              <CardHeader>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-border/80">
                  <Shield className="h-5 w-5" aria-hidden />
                </div>
                <CardTitle className="text-xl">Прозрачно</CardTitle>
                <CardDescription>Статусы и детали в одном кабинете.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  История заказов и этапы без «уточните у оператора».
                </p>
              </CardContent>
            </Card>

            <Card className="card-tech-glow hover-lift-subtle border-border/70 transition-[box-shadow,transform] duration-300 lg:col-span-1">
              <CardHeader>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-border/80">
                  <CreditCard className="h-5 w-5" aria-hidden />
                </div>
                <CardTitle className="text-xl">Удобно</CardTitle>
                <CardDescription>Оплата и напоминания — по договорённости.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Сайт + Telegram-бот: не теряете контекст между каналами.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="relative bg-surface-muted/50 py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-tech-grid opacity-[0.4]" aria-hidden />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">Как это устроено</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">От заявки до чистой квартиры</h2>
            <p className="mt-4 text-lg text-muted-foreground">Четыре шага — без сюрпризов в процессе.</p>
          </div>
          <div className="relative mx-auto grid max-w-5xl gap-12 md:grid-cols-4 md:gap-8">
            <div
              className="pointer-events-none absolute left-[8%] right-[8%] top-8 hidden h-0.5 bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20 md:block"
              aria-hidden
            />
            {[
              { step: 1, title: 'Заявка', desc: 'Адрес, тип, площадь' },
              { step: 2, title: 'Время', desc: 'Слот из доступных' },
              { step: 3, title: 'Визит', desc: 'Исполнитель приезжает' },
              { step: 4, title: 'Готово', desc: 'Проверка и оплата' },
            ].map((item) => (
              <div key={item.step} className="relative z-[1] text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-sky-700 text-lg font-bold text-primary-foreground shadow-[0_12px_36px_-4px_hsl(221_62%_45%/0.45)] ring-4 ring-background">
                  {item.step}
                </div>
                <div className="mx-auto mb-2 flex justify-center">
                  <CheckCircle className="h-5 w-5 text-primary" aria-hidden />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-white/10 bg-cta-premium py-24 text-primary-foreground md:py-32">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
          aria-hidden
        />
        <div className="pointer-events-none absolute -right-20 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <div className="container relative mx-auto px-4 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-white/90 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-premium" aria-hidden />
            Первый заказ
          </div>
          <h2 className="mx-auto mt-6 max-w-2xl text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Проверьте сервис на своей квартире
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-primary-foreground/88">
            Один заказ — и вы поймёте, удобно ли вам с нами. Без обещаний «лучшие в городе» — только результат и сервис.
          </p>
          <Link href="/orders/new" className="mt-10 inline-block">
            <Button
              size="lg"
              variant="secondary"
              className="btn-cta-shine h-14 gap-2 border-0 bg-white px-10 text-base font-semibold text-primary shadow-[0_20px_50px_-8px_rgba(0,0,0,0.35)] hover:bg-white/95"
            >
              Перейти к заказу
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  )
}
