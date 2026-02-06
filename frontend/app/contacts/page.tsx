'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Phone, Mail, MapPin, ArrowRight, MessageCircle } from 'lucide-react'

export default function ContactsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        
        <div className="relative container mx-auto px-4 py-20 md:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6 animate-fade-in">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Свяжитесь с нами</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-slide-up">
              Контакты
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Мы всегда на связи и готовы помочь
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          
          {/* Contact Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Москва и Южно-Сахалинск */}
            <Card className="border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-fade-in overflow-hidden group">
              <CardHeader className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 group-hover:from-blue-100 group-hover:to-indigo-100 transition-colors duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 gradient-primary rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <MapPin className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900 mb-1">
                      Москва, Южно-Сахалинск
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Единый номер для обоих городов
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 bg-white">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Телефон</p>
                      <a 
                        href="tel:+79621129483" 
                        className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        8 (962) 112-94-83
                      </a>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <a 
                      href="tel:+79621129483"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                      <Phone className="w-5 h-5" />
                      Позвонить
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Хабаровск */}
            <Card className="border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-fade-in overflow-hidden group" style={{ animationDelay: '0.1s' }}>
              <CardHeader className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 group-hover:from-purple-100 group-hover:to-pink-100 transition-colors duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 gradient-secondary rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <MapPin className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900 mb-1">
                      Хабаровск
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Региональный офис
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 bg-white">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Телефон</p>
                      <a 
                        href="tel:+79140866545" 
                        className="text-2xl font-bold text-gray-900 hover:text-purple-600 transition-colors"
                      >
                        8 (914) 086-65-45
                      </a>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <a 
                      href="tel:+79140866545"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                    >
                      <Phone className="w-5 h-5" />
                      Позвонить
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Contact Info */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {/* Email */}
            <Card className="border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="p-6">
                <div className="w-14 h-14 gradient-primary rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Mail className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-center text-gray-900">
                  Email
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 text-center">
                <a 
                  href="mailto:info@qlin.ru" 
                  className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  info@qlin.ru
                </a>
              </CardContent>
            </Card>

            {/* Telegram Bot */}
            <Card className="border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <CardHeader className="p-6">
                <div className="w-14 h-14 gradient-secondary rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-center text-gray-900">
                  Telegram бот
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 text-center">
                <a 
                  href="https://t.me/CleaningRu_bot" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-700 font-semibold transition-colors"
                >
                  @CleaningRu_bot
                </a>
              </CardContent>
            </Card>

            {/* Working Hours */}
            <Card className="border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <CardHeader className="p-6">
                <div className="w-14 h-14 gradient-success rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Phone className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-center text-gray-900">
                  Режим работы
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 text-center">
                <p className="text-gray-700 font-semibold">
                  Ежедневно<br />
                  <span className="text-gray-600">9:00 - 21:00</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Info Section */}
          <Card className="border-2 border-gray-200 shadow-xl bg-gradient-to-br from-indigo-50 to-purple-50 mb-16 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <CardHeader className="p-8 md:p-12">
              <CardTitle className="text-3xl font-bold mb-4 text-gray-900 text-center">
                Как с нами связаться?
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 text-center max-w-2xl mx-auto">
                Выберите удобный для вас способ связи. Мы работаем ежедневно и всегда готовы помочь
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 md:p-12 pt-0">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-lg mb-3 text-gray-900">По телефону</h3>
                  <p className="text-gray-700 mb-4">
                    Позвоните нам в рабочее время, и мы ответим на все ваши вопросы, поможем оформить заказ или решить любую проблему.
                  </p>
                  <p className="text-sm text-gray-600">
                    ⏰ Работаем ежедневно с 9:00 до 21:00
                  </p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-lg mb-3 text-gray-900">Через Telegram бот</h3>
                  <p className="text-gray-700 mb-4">
                    Используйте нашего бота для быстрого оформления заказа, отслеживания статуса и получения уведомлений.
                  </p>
                  <a 
                    href="https://t.me/CleaningRu_bot" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-600 hover:text-purple-700 font-semibold"
                  >
                    Перейти к боту →
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <div className="text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <h3 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 animate-slide-up">
              Готовы заказать уборку?
            </h3>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Оформите заказ прямо сейчас или свяжитесь с нами для консультации
            </p>
            <div className="flex gap-4 justify-center flex-wrap animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link href="/orders/new">
                <Button size="lg" className="text-lg px-8 h-14 gradient-primary text-white hover:shadow-xl hover:scale-105 transition-all duration-300 group">
                  Заказать уборку
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/">
                <Button size="lg" variant="outline" className="text-lg px-8 h-14 border-2 hover:bg-gray-50 hover:scale-105 transition-all duration-300">
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
