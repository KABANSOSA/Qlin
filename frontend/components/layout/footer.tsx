'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'

const monoHeading = 'font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/90'

export function Footer() {
  return (
    <footer className="relative mt-auto border-t border-border/50 bg-surface-muted/40 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-border before:to-transparent">
      <div className="border-b border-border/40 bg-gradient-to-br from-primary/8 via-background to-sky-500/5">
        <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 py-10 md:flex-row md:py-12">
          <div className="max-w-xl text-center md:text-left">
            <p className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              <Sparkles className="h-3.5 w-3.5 text-premium" aria-hidden />
              Готовы к чистоте?
            </p>
            <p className="mt-2 text-lg font-semibold tracking-tight text-foreground md:text-xl">
              Оформите уборку онлайн — расчёт и статусы в одном месте.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Link href="/orders/new">
              <Button variant="cta" size="lg" className="h-12 gap-2 px-8">
                Заказать уборку
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="h-12 border-border/80 bg-background/80 px-8 backdrop-blur-sm">
                Смотреть цены
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <p className="flex items-baseline gap-1 text-sm font-semibold tracking-tight text-foreground">
              <span className="bg-gradient-to-br from-primary to-sky-600 bg-clip-text text-transparent">Q</span>
              <span>LIN</span>
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Сервис уборки: заказ онлайн и сопровождение через личный кабинет и Telegram.
            </p>
            <p className="mt-4 font-mono text-[11px] leading-relaxed text-muted-foreground/80">
              <span className="text-foreground/70">Stack</span> · Next.js · REST · Telegram
            </p>
          </div>

          <div>
            <p className={monoHeading}>Клиентам</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="/orders/new" className="text-foreground/80 transition-colors hover:text-primary">
                  Заказать уборку
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-foreground/80 transition-colors hover:text-primary">
                  Мои заказы
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-foreground/80 transition-colors hover:text-primary">
                  Профиль
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className={monoHeading}>Информация</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="/about" className="text-foreground/80 transition-colors hover:text-primary">
                  О нас
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-foreground/80 transition-colors hover:text-primary">
                  Цены
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="text-foreground/80 transition-colors hover:text-primary">
                  Контакты
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className={monoHeading}>Связь</p>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="tel:+79621129483" className="text-foreground/80 transition-colors hover:text-primary">
                  8 (962) 112-94-83
                </a>
              </li>
              <li>
                <a href="mailto:info@qlin.pro" className="text-foreground/80 transition-colors hover:text-primary">
                  info@qlin.pro
                </a>
              </li>
              <li>
                <Link
                  href="https://t.me/CleaningRu_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/80 transition-colors hover:text-primary"
                >
                  Telegram-бот
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border/50 pt-8 sm:flex-row">
          <p className="text-center text-xs text-muted-foreground sm:text-left">
            &copy; {new Date().getFullYear()} QLIN. Все права защищены.
          </p>
          <p className="font-mono text-[10px] tracking-wider text-muted-foreground/70">SECURE · HTTPS · RU</p>
        </div>
      </div>
    </footer>
  )
}
