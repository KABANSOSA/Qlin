'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Home, Calculator, Plus, ArrowRight, CheckCircle, Droplet, Shirt, Bed, Square } from 'lucide-react'

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        
        <div className="relative container mx-auto px-4 py-20 md:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6 animate-fade-in">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Прозрачные цены</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-slide-up">
              Цены
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Понятные тарифы без скрытых платежей
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          
          {/* Base Cleaning Price - Large Card */}
          <div className="mb-20 animate-fade-in">
            <Card className="border-0 shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-500 hover:-translate-y-1">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-10 md:p-14">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm flex-shrink-0 hover:scale-110 transition-transform duration-300">
                    <Home className="w-10 h-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-3xl md:text-4xl font-bold mb-2 text-white">
                      Базовая уборка квартиры
                    </CardTitle>
                    <CardDescription className="text-white/95 text-lg">
                      Полная уборка квартиры до 50 кв.м
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl md:text-7xl font-bold">3 300</span>
                      <span className="text-3xl font-semibold">₽</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-10 md:p-14 bg-white">
                <div className="grid md:grid-cols-2 gap-6 mb-10">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <p className="text-gray-800 text-lg">Влажная уборка всех поверхностей</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <p className="text-gray-800 text-lg">Уборка санузла и кухни</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <p className="text-gray-800 text-lg">Пылесос и мытьё полов</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <p className="text-gray-800 text-lg">Удаление пыли со всех поверхностей</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <p className="text-gray-800 text-lg">Вынос мусора</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <p className="text-gray-800 text-lg">Уборка пыли с мебели</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Calculator className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-blue-900 text-xl">Дополнительная площадь</h3>
                      <p className="text-gray-700 text-base">
                        За каждый кв.м свыше 50 кв.м — <span className="font-bold text-xl text-blue-600">30 ₽</span>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Services */}
          <div className="mb-20 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 animate-slide-up">
                Дополнительные услуги
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Выберите дополнительные услуги для более комфортного результата
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Мойка посуды */}
              <Card className="border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-2 group animate-fade-in">
                <CardHeader className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 group-hover:from-blue-100 group-hover:to-cyan-100 transition-colors duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 gradient-primary rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <Droplet className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-bold text-gray-900 mb-1">
                        Мойка посуды
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        За единицу
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 bg-white">
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-5xl font-bold text-blue-600">10</span>
                    <span className="text-2xl text-gray-600">₽</span>
                    <span className="text-gray-500 ml-2">/ единица</span>
                  </div>
                  <p className="text-gray-700">
                    Профессиональная мойка посуды с использованием качественных моющих средств
                  </p>
                </CardContent>
              </Card>

              {/* Глажка одежды */}
              <Card className="border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-2 group animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <CardHeader className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 group-hover:from-purple-100 group-hover:to-pink-100 transition-colors duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 gradient-secondary rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <Shirt className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-bold text-gray-900 mb-1">
                        Глажка одежды
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        За единицу
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 bg-white">
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-5xl font-bold text-purple-600">70</span>
                    <span className="text-2xl text-gray-600">₽</span>
                    <span className="text-gray-500 ml-2">/ единица</span>
                  </div>
                  <p className="text-gray-700">
                    Аккуратная глажка одежды с соблюдением всех требований к тканям
                  </p>
                </CardContent>
              </Card>

              {/* Смена постельного белья */}
              <Card className="border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-2 group animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <CardHeader className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 group-hover:from-green-100 group-hover:to-emerald-100 transition-colors duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 gradient-success rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <Bed className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-bold text-gray-900 mb-1">
                        Смена постельного белья
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        За единицу
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 bg-white">
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-5xl font-bold text-green-600">200</span>
                    <span className="text-2xl text-gray-600">₽</span>
                    <span className="text-gray-500 ml-2">/ единица</span>
                  </div>
                  <p className="text-gray-700">
                    Замена постельного белья с аккуратным заправлением кровати
                  </p>
                </CardContent>
              </Card>

              {/* Мойка окон */}
              <Card className="border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-2 group animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <CardHeader className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 group-hover:from-amber-100 group-hover:to-orange-100 transition-colors duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 gradient-warm rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <Square className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-bold text-gray-900 mb-1">
                        Мойка окон
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        За единицу
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 bg-white">
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-5xl font-bold text-amber-600">150</span>
                    <span className="text-2xl text-gray-600">₽</span>
                    <span className="text-gray-500 ml-2">/ единица</span>
                  </div>
                  <p className="text-gray-700">
                    Тщательная мойка окон с обеих сторон с использованием профессиональных средств
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Price Calculator Info */}
          <div className="mb-20 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Card className="border-2 border-gray-200 shadow-xl bg-gradient-to-br from-indigo-50 to-purple-50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <CardHeader className="p-8 md:p-12">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 gradient-secondary rounded-2xl flex items-center justify-center hover:scale-110 transition-transform duration-300">
                    <Calculator className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-bold mb-2 text-gray-900">
                      Как рассчитывается стоимость?
                    </CardTitle>
                    <CardDescription className="text-lg text-gray-600">
                      Прозрачный расчёт без скрытых платежей
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 md:p-12 pt-0">
                <div className="space-y-6">
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 hover:border-indigo-300">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform duration-300">
                        <span className="text-indigo-600 font-bold text-xl">1</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-2 text-gray-900">Базовая стоимость</h3>
                        <p className="text-gray-700">
                          Для квартиры до 50 кв.м фиксированная цена — <span className="font-bold text-indigo-600">3 300 ₽</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 hover:border-indigo-300">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform duration-300">
                        <span className="text-indigo-600 font-bold text-xl">2</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-2 text-gray-900">Дополнительная площадь</h3>
                        <p className="text-gray-700 mb-2">
                          Если площадь больше 50 кв.м, добавляется <span className="font-bold text-indigo-600">30 ₽</span> за каждый дополнительный кв.м
                        </p>
                        <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded-lg">
                          Пример: квартира 65 кв.м = 3 300 ₽ + (15 × 30 ₽) = 3 750 ₽
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 hover:border-indigo-300">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform duration-300">
                        <Plus className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-2 text-gray-900">Дополнительные услуги</h3>
                        <p className="text-gray-700">
                          Стоимость дополнительных услуг суммируется к базовой цене
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <h3 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 animate-slide-up">
              Готовы заказать уборку?
            </h3>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Рассчитайте стоимость и оформите заказ за 2 минуты
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
