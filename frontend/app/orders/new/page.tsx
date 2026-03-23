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
import { AppPageHero } from '@/components/layout/app-page-hero'
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
    <div className="min-h-screen bg-background">
      <AppPageHero
        centered
        maxWidthClass="max-w-5xl"
        eyebrow="Заказ · оформление"
        title="Создать заказ"
        description="Адрес на карте, параметры уборки и удобное время — в одной форме."
      />

      <div className="container mx-auto max-w-5xl px-4 py-10">

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Card className="card-tech-glow overflow-hidden border-border/80 shadow-elevated">
          <div className="h-1 bg-gradient-to-r from-primary via-sky-500 to-cyan-500" />
          <CardHeader className="border-b border-border/60 bg-surface-muted/40 p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20">
                <MapPin className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-xl md:text-2xl">Адрес</CardTitle>
                <CardDescription className="mt-1 text-base">
                  Город, подсказки и точка на карте — координаты нужны для заказа
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6 md:p-8">
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

        <Card className="card-tech-glow mt-8 border-border/80 shadow-elevated">
          <CardHeader className="border-b border-border/60 bg-surface-muted/40 p-6 md:p-8">
            <CardTitle className="text-xl md:text-2xl">Параметры уборки</CardTitle>
            <CardDescription className="mt-1 text-base">Тип, комнаты и площадь влияют на расчёт</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6 md:p-8">
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
                  className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-input bg-background px-4 py-2 pr-10 text-sm font-medium shadow-sm transition-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ориентировочная сумма</p>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground md:text-4xl">
                  {new Intl.NumberFormat('ru-RU', {
                    style: 'currency',
                    currency: 'RUB',
                  }).format(price)}
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Итог может уточняться после проверки деталей заказа.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-tech-glow mt-8 border-border/80 shadow-elevated">
          <CardHeader className="border-b border-border/60 bg-surface-muted/40 p-6 md:p-8">
            <CardTitle className="text-xl md:text-2xl">Время и пожелания</CardTitle>
            <CardDescription className="mt-1 text-base">Слот визита и комментарий для исполнителя</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6 md:p-8">
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
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
            {error}
          </div>
        )}

        <div className="sticky bottom-0 z-10 mt-10 border-t border-border/60 bg-background/95 py-6 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="submit"
              variant="cta"
              size="lg"
              disabled={isSubmitting || !addressCoordinates || !selectedCity}
              className="h-14 flex-1 text-base sm:h-14"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Отправка…
                </span>
              ) : (
                'Создать заказ'
              )}
            </Button>
            <Button type="button" variant="outline" size="lg" className="h-12 sm:w-40" onClick={() => router.back()}>
              Отмена
            </Button>
          </div>
          {(!selectedCity || !addressCoordinates) && (
            <div
              className="mx-auto mt-4 flex max-w-5xl items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
              role="status"
            >
              <span aria-hidden className="mt-0.5 text-amber-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              <span>
                {!selectedCity
                  ? 'Сначала выберите город'
                  : !addressCoordinates
                    ? 'Выберите адрес из подсказок или на карте — нужны координаты'
                    : 'Заполните обязательные поля'}
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
