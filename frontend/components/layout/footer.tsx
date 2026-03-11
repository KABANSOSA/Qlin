'use client'

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">QLIN</h3>
            <p className="text-gray-400">
              Сервис уборки с интеграцией Telegram бота. Закажи уборку онлайн, а остальное мы возьмём на себя.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Для клиентов</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/orders/new" className="hover:text-white">Заказать уборку</Link></li>
              <li><Link href="/orders" className="hover:text-white">Мои заказы</Link></li>
              <li><Link href="/profile" className="hover:text-white">Профиль</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Информация</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/about" className="hover:text-white">О нас</Link></li>
              <li><Link href="/pricing" className="hover:text-white">Цены</Link></li>
              <li><Link href="/contacts" className="hover:text-white">Контакты</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Контакты</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="tel:+79621129483" className="hover:text-white transition-colors">8 (962) 112-94-83</a>
              </li>
              <li>
                <a href="mailto:info@qlin.ru" className="hover:text-white transition-colors">info@qlin.ru</a>
              </li>
              <li>
                <Link href="https://t.me/CleaningRu_bot" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Telegram бот
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} QLIN. Все права защищены.</p>
        </div>
      </div>
    </footer>
  )
}
