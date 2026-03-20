'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Zap, Shield, CreditCard, CheckCircle, ArrowRight } from 'lucide-react'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    setIsAuthenticated(!!token)
  }, [])

  return (
    <main className="min-h-screen">
      {/* Hero Section - Premium Design */}
      <section className="relative overflow-hidden gradient-animated text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        
        {/* Floating elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
        
        <div className="relative container mx-auto px-4 py-32 md:py-40">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6 animate-slide-down">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Премиум сервис уборки</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white animate-slide-up">
              QLIN
            </h1>
            
            <p className="text-xl md:text-2xl lg:text-3xl text-blue-100 mb-4 font-light animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Профессиональная уборка
            </p>
            <p className="text-lg md:text-xl text-blue-200 mb-12 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
              Закажи уборку онлайн за 2 минуты. Остальное мы возьмём на себя ✨
            </p>
            
            <div className="flex gap-4 justify-center flex-wrap animate-slide-up" style={{ animationDelay: '0.3s' }}>
              {isAuthenticated ? (
                <Link href="/orders/new">
                  <Button size="lg" className="text-lg px-8 h-14 bg-white text-blue-600 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                    Заказать уборку
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/orders/new">
                    <Button size="lg" className="text-lg px-8 h-14 bg-white text-blue-600 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                      Заказать уборку
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button size="lg" variant="outline" className="text-lg px-8 h-14 border-2 border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white hover:text-white">
                      Войти
                    </Button>
                  </Link>
                </>
              )}
            </div>
            
            <div className="mt-20 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <p className="text-sm md:text-base text-blue-200 text-center">
                Показываем только реальные данные в личном кабинете: статусы заказов, историю и стоимость.
              </p>
            </div>
          </div>
        </div>
        
        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-20">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Features Section - Premium Cards */}
      <section className="container mx-auto px-4 py-20 -mt-10 relative z-10">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-300 hover:-translate-y-2 animate-fade-in">
            <CardHeader>
              <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl mb-2">Быстро</CardTitle>
              <CardDescription className="text-base">
                Заказ за 2 минуты
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 leading-relaxed">
                Простая форма заказа, расчет стоимости онлайн, выбор удобного времени. Все максимально просто и быстро.
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-all duration-500 border-2 hover:border-green-400 hover-lift glass-premium animate-fade-in overflow-hidden relative" style={{ animationDelay: '0.1s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="relative z-10">
              <div className="w-20 h-20 gradient-success rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg animate-pulse-glow">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl md:text-3xl mb-2 font-extrabold text-gradient group-hover:scale-105 transition-transform">Надежно</CardTitle>
              <CardDescription className="text-base font-semibold">
                Проверенные уборщики
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-gray-700 leading-relaxed font-medium">
                Все уборщики проходят проверку и имеют рейтинг. Отслеживайте статус заказа в реальном времени.
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-all duration-500 border-2 hover:border-purple-400 hover-lift glass-premium animate-fade-in overflow-hidden relative" style={{ animationDelay: '0.2s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="relative z-10">
              <div className="w-20 h-20 gradient-secondary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg animate-pulse-glow">
                <CreditCard className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl md:text-3xl mb-2 font-extrabold text-gradient group-hover:scale-105 transition-transform">Удобно</CardTitle>
              <CardDescription className="text-base font-semibold">
                Онлайн оплата
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-gray-700 leading-relaxed font-medium">
                Оплата картой или наличными. История всех заказов в личном кабинете. Всегда под рукой.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How it works Section - Premium Design */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">Как это работает</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Всего 4 простых шага до идеальной чистоты
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connection lines for desktop */}
            <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200" />
            
            {[
              { step: 1, title: 'Оформите заказ', desc: 'Заполните форму с адресом и деталями уборки', icon: CheckCircle },
              { step: 2, title: 'Выберите время', desc: 'Укажите удобное для вас время визита', icon: CheckCircle },
              { step: 3, title: 'Уборщик приедет', desc: 'Наш специалист приедет в назначенное время', icon: CheckCircle },
              { step: 4, title: 'Оплатите', desc: 'Оплатите после завершения работы', icon: CheckCircle },
            ].map((item, index) => (
              <div key={item.step} className="text-center relative group animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="relative inline-block mb-6">
                  <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg group-hover:shadow-xl">
                    {item.step}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <item.icon className="w-5 h-5 text-green-500" />
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-2 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Готовы начать?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Оформите первый заказ и оцените сервис на практике
          </p>
          <Link href="/orders/new">
            <Button size="lg" className="text-lg px-10 h-14 bg-white text-blue-600 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all duration-300 group">
              Создать первый заказ
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  )
}
