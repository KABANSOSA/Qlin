'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProtectedRoute } from '@/components/protected-route'
import { AddressSelector } from '@/components/address-selector'
import { CitySelector } from '@/components/city-selector'
import { MapPin } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const orderSchema = z.object({
  address: z.string().min(5, 'Адрес должен содержать минимум 5 символов'),
  apartment: z.string().optional(),
  cleaning_type: z.string().min(1, 'Выберите тип уборки'),
  rooms_count: z.number().min(1).max(10),
  bathrooms_count: z.number().min(0).max(5),
  area_sqm: z.union([z.string(), z.number()]).optional().transform((v) => (v === '' || v == null ? undefined : Number(v))),
  scheduled_at: z.string(),
  special_instructions: z.string().optional(),
})

type OrderForm = z.infer<typeof orderSchema>

function NewOrderPageContent() {
  const router = useRouter()
  const { success, error: showError } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [price, setPrice] = useState<number | null>(null)
  const [addressCoordinates, setAddressCoordinates] = useState<{ lat: number; lon: number } | null>(null)
  const [selectedCity, setSelectedCity] = useState<string>('')
  const geocodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isGeocodingRef = useRef(false)
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OrderForm>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      rooms_count: 1,
      bathrooms_count: 1,
      cleaning_type: 'regular',
      address: '',
    },
  })

  const cleaningType = watch('cleaning_type')
  const roomsCount = watch('rooms_count')
  const bathroomsCount = watch('bathrooms_count')
  const areaSqmRaw = watch('area_sqm') as string | number | undefined
  const areaSqmNum =
    areaSqmRaw != null && areaSqmRaw !== '' && !Number.isNaN(Number(areaSqmRaw))
      ? Number(areaSqmRaw)
      : undefined

  // Расчёт по тарифам со страницы «Цены»: база 3 300 ₽ до 50 м², +30 ₽/м² свыше 50
  const calculatePrice = () => {
    const BASE_PRICE = 3300
    const AREA_THRESHOLD = 50
    const PRICE_PER_EXTRA_SQM = 30
    const area = (areaSqmNum != null && areaSqmNum > 0) ? areaSqmNum : (roomsCount * 25) // примерная площадь по комнатам, если не указана
    const calculated = area <= AREA_THRESHOLD
      ? BASE_PRICE
      : BASE_PRICE + (area - AREA_THRESHOLD) * PRICE_PER_EXTRA_SQM
    setPrice(Math.round(calculated))
  }

  useEffect(() => {
    calculatePrice()
  }, [roomsCount, areaSqmNum])

  const onSubmit = async (data: OrderForm) => {
    try {
      setError(null)
      
      // Validate city
      if (!selectedCity) {
        const errorMsg = 'Пожалуйста, выберите город'
        setError(errorMsg)
        showError(errorMsg, { title: 'Валидация города' })
        return
      }

      // Validate address coordinates
      if (!addressCoordinates) {
        const errorMsg = 'Пожалуйста, выберите адрес на карте или из предложенных вариантов'
        setError(errorMsg)
        showError(errorMsg, { title: 'Валидация адреса' })
        return
      }

      // TODO: Get zone_id from address geocoding based on coordinates
      const orderData = {
        ...data,
        zone_id: '00000000-0000-0000-0000-000000000000', // Placeholder - should be determined by coordinates
        has_pets: false,
        has_balcony: false,
        latitude: addressCoordinates.lat,
        longitude: addressCoordinates.lon,
      }

      const response = await api.post('/orders', orderData)
      success('Заказ успешно создан!', { title: 'Успех' })
      setTimeout(() => {
        router.push(`/orders/${response.data.id}`)
      }, 1000)
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Ошибка создания заказа'
      setError(errorMessage)
      showError(errorMessage, { title: 'Ошибка' })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-32 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>
      
      <div className="relative container mx-auto p-4 py-8 max-w-5xl">
        {/* Hero Header - Premium */}
        <div className="mb-12 text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-premium border-2 border-blue-200/50 mb-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-blue-700">Новый заказ</span>
          </div>
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold mb-6 text-gradient text-shadow-premium animate-slide-up">
            Создать заказ
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 max-w-2xl mx-auto font-medium animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Заполните форму ниже, чтобы оформить заказ на профессиональную уборку
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Address Card - Premium */}
        <Card className="border-2 shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-all duration-500 animate-slide-up glass-premium hover-lift group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="gradient-animated text-white rounded-t-lg p-6 transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <CardTitle className="text-2xl md:text-3xl flex items-center gap-3 font-bold">
                <div className="w-14 h-14 bg-white/25 rounded-xl flex items-center justify-center backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg">
                  <MapPin className="h-7 w-7" />
                </div>
                Адрес уборки
              </CardTitle>
              <CardDescription className="text-white/95 mt-3 text-base font-medium">Укажите точный адрес или выберите на интерактивной карте</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6 relative z-10">
            <div className="mb-4">
              <label htmlFor="city" className="block text-sm font-semibold mb-2.5 text-gray-700 flex items-center gap-2">
                <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Город *
              </label>
              <CitySelector
                value={selectedCity}
                onChange={(city) => {
                  setSelectedCity(city)
                  // Clear address when city changes
                  setValue('address', '', { shouldValidate: false })
                  setAddressCoordinates(null)
                }}
                placeholder="Начните вводить название города (например: Москва, Челябинск)"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-semibold mb-2.5 text-gray-700 flex items-center gap-2">
                <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Адрес *
              </label>
              <AddressSelector
                value={watch('address') || ''}
                onChange={(address, coordinates) => {
                  setValue('address', address, { shouldValidate: true })
                  
                  // Clear any pending geocoding
                  if (geocodeTimeoutRef.current) {
                    clearTimeout(geocodeTimeoutRef.current)
                    geocodeTimeoutRef.current = null
                  }
                  
                  if (coordinates) {
                    // Coordinates provided directly - use them immediately
                    setAddressCoordinates(coordinates)
                    setError(null)
                    isGeocodingRef.current = false
                  } else if (address && address.length >= 5 && !isGeocodingRef.current) {
                    // If address is provided but no coordinates, geocode it with debounce
                    isGeocodingRef.current = true
                    geocodeTimeoutRef.current = setTimeout(async () => {
                      try {
                        const { geocodeAddress } = await import('@/lib/yandex-maps')
                        const results = await geocodeAddress(address, 1)
                        if (results.length > 0 && results[0].coordinates) {
                          setAddressCoordinates(results[0].coordinates)
                          setError(null)
                        } else {
                          setAddressCoordinates(null)
                        }
                      } catch (error) {
                        console.error('Failed to geocode address:', error)
                        setAddressCoordinates(null)
                      } finally {
                        isGeocodingRef.current = false
                        geocodeTimeoutRef.current = null
                      }
                    }, 500) // 500ms debounce
                  } else {
                    // Clear coordinates if address is manually typed and too short
                    setAddressCoordinates(null)
                    isGeocodingRef.current = false
                  }
                }}
                error={errors.address?.message}
                placeholder={selectedCity ? `Введите адрес в ${selectedCity} или выберите на карте` : "Сначала выберите город"}
                disabled={!selectedCity}
                city={selectedCity}
              />
            </div>

            <div>
              <label htmlFor="apartment" className="block text-sm font-semibold mb-2.5 text-gray-700 flex items-center gap-2">
                <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Квартира
              </label>
              <Input
                id="apartment"
                placeholder="12"
                className="h-12 text-base border-2 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200"
                {...register('apartment')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Cleaning Details Card - Premium */}
        <Card className="border-2 shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-all duration-500 animate-slide-up glass-premium hover-lift group overflow-hidden relative" style={{ animationDelay: '0.1s' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white rounded-t-lg p-6 transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <CardTitle className="text-2xl md:text-3xl flex items-center gap-3 font-bold">
                <div className="w-14 h-14 bg-white/25 rounded-xl flex items-center justify-center backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                Детали уборки
              </CardTitle>
              <CardDescription className="text-white/95 mt-3 text-base font-medium">Выберите тип и параметры уборки</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6 relative z-10">
            <div>
              <label htmlFor="cleaning_type" className="block text-sm font-semibold mb-2.5 text-gray-700 flex items-center gap-2">
                <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Тип уборки *
              </label>
              <div className="relative group">
                <select
                  id="cleaning_type"
                  className="flex h-12 w-full rounded-lg border-2 border-gray-300 bg-white px-4 pr-12 py-3 text-sm font-medium text-gray-900 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 appearance-none cursor-pointer hover:border-purple-400 hover:shadow-md shadow-sm"
                  {...register('cleaning_type')}
                >
                  <option value="regular">Обычная уборка</option>
                  <option value="deep">Генеральная уборка</option>
                  <option value="move_in">Уборка после ремонта</option>
                  <option value="move_out">Уборка перед выездом</option>
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-transform duration-200 group-hover:scale-110">
                  <svg className="h-5 w-5 text-gray-500 group-hover:text-purple-600 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {errors.cleaning_type && (
                <p className="text-xs text-destructive mt-1.5 flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {errors.cleaning_type.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="rooms_count" className="block text-sm font-semibold mb-2.5 text-gray-700 flex items-center gap-2">
                  <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Комнат *
                </label>
                <Input
                  id="rooms_count"
                  type="number"
                  min="1"
                  max="10"
                  className="h-12 text-base border-2 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                  {...register('rooms_count', { valueAsNumber: true })}
                />
                {errors.rooms_count && (
                  <p className="text-xs text-destructive mt-1.5">
                    {errors.rooms_count.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="bathrooms_count" className="block text-sm font-semibold mb-2.5 text-gray-700 flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                  Санузлов *
                </label>
                <Input
                  id="bathrooms_count"
                  type="number"
                  min="0"
                  max="5"
                  className="h-12 text-base border-2 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                  {...register('bathrooms_count', { valueAsNumber: true })}
                />
                {errors.bathrooms_count && (
                  <p className="text-xs text-destructive mt-1.5">
                    {errors.bathrooms_count.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="area_sqm" className="block text-sm font-semibold mb-2.5 text-gray-700 flex items-center gap-2">
                <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                Площадь, м² <span className="text-gray-400 font-normal">(необязательно, для точного расчёта)</span>
              </label>
              <Input
                id="area_sqm"
                type="number"
                min={1}
                max={500}
                placeholder="Например 65"
                className="h-12 text-base border-2 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all duration-200"
                {...register('area_sqm')}
              />
            </div>

            {price && (
              <div className="gradient-animated p-8 rounded-2xl text-white shadow-2xl animate-scale-in relative overflow-hidden group">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10">
                  <p className="text-sm text-white/90 mb-3 font-semibold uppercase tracking-wide">Примерная стоимость</p>
                  <p className="text-5xl md:text-6xl font-extrabold mb-3 text-shadow-premium group-hover:scale-105 transition-transform duration-300">
                    {new Intl.NumberFormat('ru-RU', {
                      style: 'currency',
                      currency: 'RUB',
                    }).format(price)}
                  </p>
                  <p className="text-sm text-white/80 mt-2 flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Окончательная цена может измениться
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Time Card - Premium */}
        <Card className="border-2 shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-all duration-500 animate-slide-up glass-premium hover-lift group overflow-hidden relative" style={{ animationDelay: '0.2s' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white rounded-t-lg p-6 transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <CardTitle className="text-2xl md:text-3xl flex items-center gap-3 font-bold">
                <div className="w-14 h-14 bg-white/25 rounded-xl flex items-center justify-center backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Время и дополнительные требования
              </CardTitle>
              <CardDescription className="text-white/95 mt-3 text-base font-medium">Укажите удобное время и особые пожелания</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6 relative z-10">
              <div>
                <label htmlFor="scheduled_at" className="block text-sm font-semibold mb-2.5 text-gray-700 flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Дата и время *
                </label>
                <div className="relative">
                  <Input
                    id="scheduled_at"
                    type="datetime-local"
                    min={new Date().toISOString().slice(0, 16)}
                    className="h-12 text-base border-2 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                    {...register('scheduled_at')}
                  />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              {errors.scheduled_at && (
                <p className="text-xs text-destructive mt-1.5 flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {errors.scheduled_at.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="special_instructions" className="block text-sm font-semibold mb-2.5 text-gray-700 flex items-center gap-2">
                <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Особые указания
              </label>
              <Textarea
                id="special_instructions"
                placeholder="Дополнительная информация для уборщика..."
                rows={5}
                className="border-2 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all duration-200 text-base resize-none"
                {...register('special_instructions')}
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}

        {/* Submit Section - Premium */}
        <div className="sticky bottom-0 glass-premium border-t-2 border-gray-200/50 p-6 rounded-t-2xl shadow-2xl -mx-4 -mb-8 mt-8 backdrop-blur-xl">
          <div className="flex gap-4 max-w-5xl mx-auto">
            <Button
              type="submit"
              disabled={isSubmitting || !addressCoordinates || !selectedCity}
              className="flex-1 h-16 text-lg font-bold gradient-animated text-white hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl animate-pulse-glow hover:scale-105 active:scale-95 relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Создание заказа...</span>
                  </>
                ) : (
                  <>
                    <span>Создать заказ</span>
                    <svg className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
              <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100"></div>
            </Button>
                     <Button
                       type="button"
                       variant="outline"
                       onClick={() => router.back()}
                       className="h-16 px-8 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
                     >
                       Отмена
                     </Button>
          </div>
                   {(!selectedCity || !addressCoordinates) && (
                     <div className="mt-4 text-sm text-amber-700 bg-amber-50 p-4 rounded-lg border-2 border-amber-200 flex items-center gap-2 animate-slide-up">
                       <svg className="h-5 w-5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                       </svg>
                       <span>
                         {!selectedCity 
                           ? 'Пожалуйста, сначала выберите город'
                           : !addressCoordinates
                           ? 'Пожалуйста, выберите адрес из предложенных вариантов или на карте. Координаты необходимы для создания заказа.'
                           : 'Пожалуйста, заполните все обязательные поля'
                         }
                       </span>
                     </div>
                   )}
        </div>
      </form>
      </div>
    </div>
  )
}

export default function NewOrderPage() {
  return (
    <ProtectedRoute>
      <NewOrderPageContent />
    </ProtectedRoute>
  )
}
