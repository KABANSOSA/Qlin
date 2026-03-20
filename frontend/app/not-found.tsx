import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="mb-4 text-6xl font-semibold tabular-nums text-primary">404</p>
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Страница не найдена
        </h1>
        <p className="mb-8 text-muted-foreground">
          Такой страницы нет или она была удалена. Вернитесь на главную или оформите заказ на уборку.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link href="/">
            <Button size="lg" className="w-full gap-2 sm:w-auto">
              <Home className="h-5 w-5" />
              На главную
            </Button>
          </Link>
          <Link href="/orders/new">
            <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
              <Search className="h-5 w-5" />
              Заказать уборку
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
