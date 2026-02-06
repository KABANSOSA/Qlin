'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, Lightbulb, Target, Rocket, Heart, ArrowRight, CheckCircle } from 'lucide-react'

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-animated text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        
        {/* Floating elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
        
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6 animate-slide-down">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Наша история</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white animate-slide-up">
              О нас
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Мы пришли в клининг не случайно
            </p>
          </div>
        </div>
        
        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-20">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-16 md:py-24 -mt-10 relative z-10">
        <div className="max-w-4xl mx-auto">
          
          {/* Story Section */}
          <div className="space-y-8 mb-16">
            <Card className="border-2 shadow-xl bg-white/95 backdrop-blur-sm animate-fade-in overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
              <CardContent className="relative p-8 md:p-12">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gradient">Как всё начиналось</h2>
                  </div>
                </div>
                
                <div className="space-y-6 text-gray-700 leading-relaxed text-lg">
                  <p className="text-xl font-medium text-gray-900">
                    Несколько лет мы занимались сдачей жилья в аренду — и постоянно сталкивались с одной и той же проблемой: найти стабильный, удобный и предсказуемый клининг было сложно. То качество не устраивало, то сроки срывались, то процесс заказа превращался в отдельную задачу.
                  </p>
                  
                  <p>
                    Параллельно мы, как обычные люди, хотели заказывать уборку и для себя — домой. И снова сталкивались с тем же: сложные заявки, звонки, ожидание, непрозрачные цены.
                  </p>
                  
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg my-6">
                    <p className="text-xl font-semibold text-blue-900 italic">
                      В какой-то момент стало очевидно: на рынке просто нет сервиса, которым мы сами хотели бы пользоваться.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-xl bg-white/95 backdrop-blur-sm animate-fade-in overflow-hidden" style={{ animationDelay: '0.1s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50"></div>
              <CardContent className="relative p-8 md:p-12">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 gradient-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gradient">Идея нового формата</h2>
                  </div>
                </div>
                
                <div className="space-y-6 text-gray-700 leading-relaxed text-lg">
                  <p>
                    Мы провели анализ конкурентов, посмотрели, как работают существующие компании, какие у них процессы, интерфейсы и подход к клиенту — и поняли, что можем сделать лучше.
                  </p>
                  
                  <p className="text-xl font-medium text-gray-900">
                    Так родилась идея создать клининг нового формата.
                  </p>
                  
                  <p>
                    Мы вдохновлялись тем, как Uber когда-то сделал такси доступным для всех: простой заказ, понятная цена, быстрый результат, минимум действий со стороны клиента. Точно такую же философию мы решили применить к уборке.
                  </p>
                  
                  <div className="grid md:grid-cols-3 gap-4 mt-8">
                    <div className="bg-white/80 rounded-lg p-4 border-2 border-purple-200 text-center">
                      <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <p className="font-semibold text-gray-900">Без сложностей</p>
                    </div>
                    <div className="bg-white/80 rounded-lg p-4 border-2 border-purple-200 text-center">
                      <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <p className="font-semibold text-gray-900">Без лишних звонков</p>
                    </div>
                    <div className="bg-white/80 rounded-lg p-4 border-2 border-purple-200 text-center">
                      <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <p className="font-semibold text-gray-900">Без неопределённости</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-xl bg-white/95 backdrop-blur-sm animate-fade-in overflow-hidden" style={{ animationDelay: '0.2s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50"></div>
              <CardContent className="relative p-8 md:p-12">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 gradient-success rounded-xl flex items-center justify-center flex-shrink-0">
                    <Rocket className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gradient">Создание продукта</h2>
                  </div>
                </div>
                
                <div className="space-y-6 text-gray-700 leading-relaxed text-lg">
                  <p>
                    Мы продумали концепцию сервиса, где заказать клининг можно в несколько шагов, разработали бота, автоматизировали процессы — и начали создавать продукт, который решает реальные задачи людей, а не усложняет им жизнь.
                  </p>
                  
                  <p className="text-xl font-medium text-gray-900">
                    Сегодня мы не просто компания по уборке. Мы строим сервис, который меняет представление о клининге.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white animate-fade-in overflow-hidden" style={{ animationDelay: '0.3s' }}>
              <CardContent className="relative p-8 md:p-12">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">Наша миссия</h2>
                  </div>
                </div>
                
                <div className="space-y-6 leading-relaxed text-lg text-blue-50">
                  <p className="text-xl font-medium text-white">
                    И мы уверены: это только начало. Наш проект создаётся с прицелом на федеральный масштаб.
                  </p>
                  
                  <p className="text-2xl font-bold text-white">
                    Мы здесь, чтобы сделать чистоту простой, доступной и технологичной — для каждого.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <h3 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">Готовы попробовать?</h3>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Присоединяйтесь к тысячам довольных клиентов
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/orders/new">
                <Button size="lg" className="text-lg px-8 h-14 gradient-primary text-white hover:shadow-xl transition-all duration-300 group">
                  Заказать уборку
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/">
                <Button size="lg" variant="outline" className="text-lg px-8 h-14 border-2 hover:bg-gray-50">
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
