'use client'

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-surface-muted/50">
      <div className="container mx-auto px-4 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <p className="text-sm font-semibold tracking-tight text-foreground">QLIN</p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Сервис уборки: заказ онлайн и сопровождение через личный кабинет и Telegram.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Клиентам</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="/orders/new" className="text-foreground/80 transition-colors hover:text-foreground">
                  Заказать уборку
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-foreground/80 transition-colors hover:text-foreground">
                  Мои заказы
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-foreground/80 transition-colors hover:text-foreground">
                  Профиль
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Информация</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="/about" className="text-foreground/80 transition-colors hover:text-foreground">
                  О нас
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-foreground/80 transition-colors hover:text-foreground">
                  Цены
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="text-foreground/80 transition-colors hover:text-foreground">
                  Контакты
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Контакты</p>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="tel:+79621129483" className="text-foreground/80 transition-colors hover:text-foreground">
                  8 (962) 112-94-83
                </a>
              </li>
              <li>
                <a href="mailto:info@qlin.ru" className="text-foreground/80 transition-colors hover:text-foreground">
                  info@qlin.ru
                </a>
              </li>
              <li>
                <Link
                  href="https://t.me/CleaningRu_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/80 transition-colors hover:text-foreground"
                >
                  Telegram-бот
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border/60 pt-8 text-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} QLIN. Все права защищены.</p>
        </div>
      </div>
    </footer>
  )
}
