import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search, Sparkles } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="relative flex min-h-[75vh] flex-col items-center justify-center overflow-hidden bg-hero-mesh px-4 py-16">
      <div className="hero-spotlight pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative z-[1] max-w-lg text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 to-transparent px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
          <Sparkles className="h-3.5 w-3.5 text-premium" aria-hidden />
          Страница
        </p>
        <p className="mt-8 bg-gradient-to-br from-primary to-sky-600 bg-clip-text text-7xl font-bold tabular-nums text-transparent md:text-8xl">
          404
        </p>
        <h1 className="mt-4 text-balance text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Такой страницы нет
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Ссылка устарела или адрес набран с опечаткой. Зато у нас есть главная и заказ уборки.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link href="/">
            <Button size="lg" variant="cta" className="w-full gap-2 sm:w-auto">
              <Home className="h-5 w-5" aria-hidden />
              На главную
            </Button>
          </Link>
          <Link href="/orders/new">
            <Button size="lg" variant="outline" className="w-full gap-2 border-border/80 bg-background/80 backdrop-blur-sm sm:w-auto">
              <Search className="h-5 w-5" aria-hidden />
              Заказать уборку
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
