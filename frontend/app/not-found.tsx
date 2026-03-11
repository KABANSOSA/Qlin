import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
          404
        </p>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Страница не найдена
        </h1>
        <p className="text-gray-600 mb-8">
          Такой страницы нет или она была удалена. Вернитесь на главную или оформите заказ на уборку.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button size="lg" className="w-full sm:w-auto gradient-primary text-white gap-2">
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
