'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, Shield, CreditCard, CheckCircle, ArrowRight, Sparkles } from 'lucide-react'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    setIsAuthenticated(!!token)
  }, [])

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden bg-hero-mesh">
        <div className="container relative mx-auto px-4 pb-20 pt-24 md:pb-28 md:pt-32">
          <div className="mx-auto max-w-3xl text-center animate-fade-in">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/90 px-4 py-2 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm animate-slide-down">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
              <span>Сервис уборки</span>
            </div>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl lg:text-display-sm">
              Чистота без лишних шагов
            </h1>
            <p className="mt-6 text-balance text-lg leading-relaxed text-muted-foreground md:text-xl">
              Оформите заказ онлайн: адрес, время и детали — в одном потоке. В личном кабинете видны статусы,
              история и стоимость.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="/orders/new">
                <Button size="lg" className="gap-2 px-8">
                  Заказать уборку
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </Link>
              {!isAuthenticated && (
                <Link href="/auth/login">
                  <Button size="lg" variant="outline" className="px-8">
                    Войти
                  </Button>
                </Link>
              )}
            </div>
            <p className="mx-auto mt-12 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Мы не показываем выдуманную статистику — только ваши реальные данные после регистрации.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-card py-20 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Почему QLIN</h2>
            <p className="mt-3 text-muted-foreground md:text-lg">
              Три опоры сервиса: скорость оформления, предсказуемый процесс и понятные опции оплаты.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="hover-lift-subtle border-border/70">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Zap className="h-6 w-6" aria-hidden />
                </div>
                <CardTitle className="text-lg md:text-xl">Быстро</CardTitle>
                <CardDescription>Минимум полей, расчёт по понятным правилам.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Форма заказа ведёт по шагам: адрес на карте, параметры уборки, время. Ориентировочная стоимость —
                  до подтверждения.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-lift-subtle border-border/70">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Shield className="h-6 w-6" aria-hidden />
                </div>
                <CardTitle className="text-lg md:text-xl">Прозрачно</CardTitle>
                <CardDescription>Статусы и детали — в кабинете.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Отслеживайте этапы заказа и историю обращений. Всё собрано в одном месте без звонков в колл-центр.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-lift-subtle border-border/70">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <CreditCard className="h-6 w-6" aria-hidden />
                </div>
                <CardTitle className="text-lg md:text-xl">Удобно</CardTitle>
                <CardDescription>Оплата и напоминания — как договоримся.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Поддержка через сайт и Telegram-бот: уведомления и повторные визиты без потери контекста.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-surface-muted/50 py-20 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Как это работает</h2>
            <p className="mt-3 text-muted-foreground md:text-lg">Четыре шага от заявки до результата.</p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-4">
            {[
              { step: 1, title: 'Оформите заказ', desc: 'Адрес на карте, тип и площадь' },
              { step: 2, title: 'Выберите время', desc: 'Удобный слот из доступных' },
              { step: 3, title: 'Визит', desc: 'Исполнитель в назначенное время' },
              { step: 4, title: 'Итог', desc: 'Проверка и оплата по правилам тарифа' },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-elevated">
                  {item.step}
                </div>
                <div className="mx-auto mb-2 flex justify-center">
                  <CheckCircle className="h-5 w-5 text-primary/70" aria-hidden />
                </div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-primary py-20 text-primary-foreground md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Начните с первого заказа</h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/85 md:text-lg">
            Оцените сервис на практике — без обещаний «тысяч отзывов», только ваш опыт.
          </p>
          <Link href="/orders/new" className="mt-8 inline-block">
            <Button
              size="lg"
              variant="secondary"
              className="gap-2 bg-card text-foreground shadow-elevated hover:bg-card/95"
            >
              Создать заказ
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  )
}
