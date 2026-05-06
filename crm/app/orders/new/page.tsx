'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { CrmShell } from '@/components/crm-shell'
import { CrmAccessBarrier } from '@/components/crm-access-barrier'
import { useCrmAccess } from '@/lib/use-crm-access'

const ZONE_PLACEHOLDER = '00000000-0000-0000-0000-000000000000'

function formatLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function localDateTimeToUtcIso(dateStr: string, timeStr: string): string {
  const t = timeStr.length === 5 ? `${timeStr}:00` : timeStr
  const ms = new Date(`${dateStr}T${t}`).getTime()
  if (Number.isNaN(ms)) {
    throw new Error('invalid_datetime')
  }
  return new Date(ms).toISOString()
}

function parseDetail(err: unknown): string {
  const ax = err as { response?: { data?: { detail?: unknown } } }
  const raw = ax.response?.data?.detail
  if (typeof raw === 'string') return raw
  if (Array.isArray(raw)) {
    return raw
      .map((e: { loc?: (string | number)[]; msg?: string }) => {
        const path = Array.isArray(e.loc) ? e.loc.filter((x) => x !== 'body').join(' · ') : ''
        return path ? `${path}: ${e.msg || 'ошибка'}` : e.msg || JSON.stringify(e)
      })
      .join('; ')
  }
  if (raw != null && typeof raw === 'object') return JSON.stringify(raw)
  return 'Не удалось создать заявку'
}

export default function CrmNewOrderPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const { loading, user, error, retry } = useCrmAccess()

  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [serviceCity, setServiceCity] = useState<'khabarovsk' | 'yuzhno_sakhalinsk' | ''>('')
  const [address, setAddress] = useState('')
  const [apartment, setApartment] = useState('')
  const [addressLat, setAddressLat] = useState('')
  const [addressLon, setAddressLon] = useState('')
  const [cleaningType, setCleaningType] = useState<'regular' | 'deep'>('regular')
  const [roomsCount, setRoomsCount] = useState(1)
  const [bathroomsCount, setBathroomsCount] = useState(1)
  const [areaSqm, setAreaSqm] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [schedDate, setSchedDate] = useState('')
  const [schedTime, setSchedTime] = useState('10:00')
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    const t = new Date()
    t.setDate(t.getDate() + 1)
    t.setHours(10, 0, 0, 0)
    setSchedDate(formatLocalDate(t))
    setSchedTime('10:00')
  }, [])

  const createMutation = useMutation({
    mutationFn: async () => {
      setFormError(null)
      if (!customerPhone.trim()) throw new Error('Укажите телефон клиента')
      if (!serviceCity) throw new Error('Выберите город обслуживания')
      if (address.trim().length < 5) throw new Error('Адрес — минимум 5 символов')
      const area = Number(areaSqm.replace(',', '.'))
      if (!areaSqm.trim() || Number.isNaN(area) || area <= 0 || area > 500) {
        throw new Error('Укажите площадь от 1 до 500 м²')
      }
      let scheduledAtIso: string
      try {
        scheduledAtIso = localDateTimeToUtcIso(schedDate, schedTime)
      } catch {
        throw new Error('Укажите корректную дату и время визита')
      }
      if (new Date(scheduledAtIso).getTime() <= Date.now()) {
        throw new Error('Дата и время визита должны быть в будущем')
      }

      let latNum: number | undefined
      let lonNum: number | undefined
      if (addressLat.trim() || addressLon.trim()) {
        latNum = Number(addressLat.replace(',', '.'))
        lonNum = Number(addressLon.replace(',', '.'))
        if (Number.isNaN(latNum) || Number.isNaN(lonNum)) {
          throw new Error('Широта и долгота должны быть числами (или оставьте оба поля пустыми)')
        }
      }

      const payload: Record<string, unknown> = {
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || undefined,
        zone_id: ZONE_PLACEHOLDER,
        address: address.trim(),
        apartment: apartment.trim() || undefined,
        cleaning_type: cleaningType,
        rooms_count: roomsCount,
        bathrooms_count: bathroomsCount,
        area_sqm: area,
        has_pets: false,
        has_balcony: false,
        special_instructions: specialInstructions.trim() || undefined,
        extra_services: {},
        scheduled_at: scheduledAtIso,
        service_city: serviceCity,
        payment_method: paymentMethod,
      }
      if (latNum != null && lonNum != null) {
        payload.address_lat = latNum
        payload.address_lon = lonNum
      }

      const { data } = await api.post('/admin/orders', payload)
      return data as { id: string }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      router.push('/orders')
    },
    onError: (err: unknown) => {
      if (err instanceof Error && err.message && !('response' in err)) {
        setFormError(err.message)
        return
      }
      setFormError(parseDetail(err))
    },
  })

  if (loading || error || !user) {
    return <CrmAccessBarrier loading={loading} user={user} error={error} retry={retry} />
  }

  return (
    <CrmShell mePhone={user.phone}>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-6">
          <Link
            href="/orders"
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            К списку заявок
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Новая заявка</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Заявка создаётся от имени клиента по телефону. Если профиля ещё нет, он будет создан автоматически.
          </p>
        </div>

        <form
          className="space-y-6 rounded-xl border border-border bg-white p-6 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate()
          }}
        >
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {formError}
            </div>
          )}

          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Клиент</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-foreground">Телефон *</span>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+7 999 123-45-67"
                  className="w-full rounded-md border border-border bg-[#f5f6f8] px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/25"
                  autoComplete="tel"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-foreground">Email</span>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="необязательно"
                  className="w-full rounded-md border border-border bg-[#f5f6f8] px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/25"
                  autoComplete="email"
                />
              </label>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Объект</h2>
            <div className="grid gap-4">
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-foreground">Город обслуживания *</span>
                <select
                  value={serviceCity}
                  onChange={(e) =>
                    setServiceCity(e.target.value as 'khabarovsk' | 'yuzhno_sakhalinsk' | '')
                  }
                  className="w-full rounded-md border border-border bg-[#f5f6f8] px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/25"
                >
                  <option value="">Выберите город</option>
                  <option value="khabarovsk">Хабаровск</option>
                  <option value="yuzhno_sakhalinsk">Южно-Сахалинск</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-foreground">Адрес *</span>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="улица, дом"
                  className="w-full rounded-md border border-border bg-[#f5f6f8] px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/25"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-foreground">Квартира / подъезд</span>
                <input
                  type="text"
                  value={apartment}
                  onChange={(e) => setApartment(e.target.value)}
                  placeholder="необязательно"
                  className="w-full rounded-md border border-border bg-[#f5f6f8] px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/25"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-foreground">Широта</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={addressLat}
                    onChange={(e) => setAddressLat(e.target.value)}
                    placeholder="необязательно"
                    className="w-full rounded-md border border-border bg-[#f5f6f8] px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/25"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-foreground">Долгота</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={addressLon}
                    onChange={(e) => setAddressLon(e.target.value)}
                    placeholder="необязательно"
                    className="w-full rounded-md border border-border bg-[#f5f6f8] px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/25"
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Координаты необязательны; без них заказ всё равно создаётся. Укажите оба значения, если
                копируете точку с карты.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Визит</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-foreground">Дата *</span>
                <input
                  type="date"
                  value={schedDate}
                  onChange={(e) => setSchedDate(e.target.value)}
                  className="w-full rounded-md border border-border bg-[#f5f6f8] px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/25"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-foreground">Время *</span>
                <input
                  type="time"
                  value={schedTime}
                  onChange={(e) => setSchedTime(e.target.value)}
                  className="w-full rounded-md border border-border bg-[#f5f6f8] px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/25"
                />
              </label>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Уборка</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-foreground">Тип</span>
                <select
                  value={cleaningType}
                  onChange={(e) => setCleaningType(e.target.value as 'regular' | 'deep')}
                  className="w-full rounded-md border border-border bg-[#f5f6f8] px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/25"
                >
                  <option value="regular">Поддерживающая</option>
                  <option value="deep">Генеральная (×2 к базе по площади)</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-foreground">Площадь, м² *</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={areaSqm}
                  onChange={(e) => setAreaSqm(e.target.value)}
                  placeholder="например 45"
                  className="w-full rounded-md border border-border bg-[#f5f6f8] px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/25"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-foreground">Комнат</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={roomsCount}
                  onChange={(e) => setRoomsCount(Number(e.target.value) || 1)}
                  className="w-full rounded-md border border-border bg-[#f5f6f8] px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/25"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-foreground">Санузлов</span>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={bathroomsCount}
                  onChange={(e) => setBathroomsCount(Number(e.target.value) || 0)}
                  className="w-full rounded-md border border-border bg-[#f5f6f8] px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/25"
                />
              </label>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Оплата</h2>
            <div className="flex flex-wrap gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="pay"
                  checked={paymentMethod === 'cash'}
                  onChange={() => setPaymentMethod('cash')}
                  className="accent-brand"
                />
                Наличные
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="pay"
                  checked={paymentMethod === 'transfer'}
                  onChange={() => setPaymentMethod('transfer')}
                  className="accent-brand"
                />
                Перевод на карту
              </label>
            </div>
          </section>

          <section>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-foreground">Комментарий для бригады</span>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={3}
                placeholder="ключи, домофон, пожелания…"
                className="w-full rounded-md border border-border bg-[#f5f6f8] px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/25"
              />
            </label>
          </section>

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors',
                createMutation.isPending ? 'cursor-not-allowed bg-brand/60' : 'bg-brand hover:bg-brand-hover',
              )}
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Создать заявку
            </button>
            <Link
              href="/orders"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Отмена
            </Link>
          </div>
        </form>
      </main>
    </CrmShell>
  )
}
