import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import { Redirect, useNavigation, useRouter } from 'expo-router'
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth-context'
import { BOOKING_OFFERS, type CleaningValue } from '@/lib/booking-offers'
import {
  DEFAULT_SERVICE_CITY_ID,
  QLIN_CITIES_LINE,
  QLIN_REGION_TAGLINE,
  SERVICE_CITIES,
  SERVICE_CITY_IDS,
  type ServiceCityId,
} from '@/lib/service-cities'
import { light, medium } from '@/lib/haptics'
import { theme } from '@/theme/tokens'

const QUICK_ADDRESS_HINTS = ['Дом', 'Офис', 'Апартаменты']
const CITY_ADDRESS_SUGGESTIONS: Record<ServiceCityId, string[]> = {
  khabarovsk: [
    'Хабаровск, ул. Муравьева-Амурского, 25',
    'Хабаровск, ул. Ленина, 43',
    'Хабаровск, ул. Тихоокеанская, 201',
  ],
  yuzhno_sakhalinsk: [
    'Южно-Сахалинск, пр-т Мира, 113',
    'Южно-Сахалинск, ул. Комсомольская, 259',
    'Южно-Сахалинск, ул. Ленина, 252Б',
  ],
}

const QUICK_MODES: {
  id: 'express' | 'standard' | 'deep'
  label: string
  cleaning: CleaningValue
  area: string
  hoursFromNow: number
}[] = [
  { id: 'express', label: 'Экспресс', cleaning: 'regular', area: '35', hoursFromNow: 2 },
  { id: 'standard', label: 'Стандарт', cleaning: 'regular', area: '50', hoursFromNow: 24 },
  { id: 'deep', label: 'Генеральная', cleaning: 'deep', area: '65', hoursFromNow: 30 },
]

function defaultTomorrowTen(): Date {
  const t = new Date()
  t.setDate(t.getDate() + 1)
  t.setSeconds(0, 0)
  t.setMilliseconds(0)
  t.setHours(10, 0, 0, 0)
  return t
}

export default function CustomerBookingHomeScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()

  const [address, setAddress] = useState('')
  const [entrance, setEntrance] = useState('')
  const [areaSqm, setAreaSqm] = useState('42')
  const [cleaningType, setCleaningType] = useState<CleaningValue>('regular')
  const [scheduled, setScheduled] = useState(() => defaultTomorrowTen())
  const [showPicker, setShowPicker] = useState(false)
  const [cityId, setCityId] = useState<ServiceCityId>(DEFAULT_SERVICE_CITY_ID)
  const [quickMode, setQuickMode] = useState<'express' | 'standard' | 'deep' | null>(null)
  const [remoteSuggestions, setRemoteSuggestions] = useState<string[]>([])
  const [suggestLoading, setSuggestLoading] = useState(false)
  const city = SERVICE_CITIES[cityId]

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Заказ',
      headerRight: () => (
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => {
              void light()
              router.push('/customer/orders')
            }}
            hitSlop={12}
            accessibilityLabel="Мои заказы"
          >
            <Ionicons name="list-outline" size={24} color={theme.color.primary} />
          </Pressable>
          <Pressable
            onPress={() => {
              void light()
              router.push('/customer/profile')
            }}
            hitSlop={12}
            accessibilityLabel="Профиль"
          >
            <Ionicons name="person-circle-outline" size={26} color={theme.color.primary} />
          </Pressable>
        </View>
      ),
    })
  }, [navigation, router])

  if (!user) return <Redirect href="/login" />
  if (user.role === 'cleaner') return <Redirect href="/cleaner" />

  const goCheckout = () => {
    const addr = address.trim()
    if (addr.length < 5) {
      Alert.alert('Адрес', 'Введите полный адрес (не короче 5 символов)')
      return
    }
    if (scheduled.getTime() <= Date.now()) {
      Alert.alert('Время', 'Выберите дату и время визита в будущем')
      return
    }
    void medium()
    router.push({
      pathname: '/customer/new',
      params: {
        address: addr,
        cleaningType,
        areaSqm: areaSqm.trim(),
        scheduled: scheduled.toISOString(),
        entrance: entrance.trim(),
        serviceCity: city.name,
        serviceCityId: cityId,
      },
    })
  }

  const addressReady = address.trim().length >= 5
  const timeReady = scheduled.getTime() > Date.now()
  const flowReady = addressReady && timeReady
  const progressCount = [addressReady, timeReady].filter(Boolean).length

  const applyQuickTime = (hoursFromNow: number) => {
    const d = new Date()
    d.setMinutes(0, 0, 0)
    d.setHours(d.getHours() + hoursFromNow)
    if (d.getTime() <= Date.now()) d.setHours(d.getHours() + 1)
    setScheduled(d)
  }

  const applyQuickMode = (mode: (typeof QUICK_MODES)[number]) => {
    setQuickMode(mode.id)
    setCleaningType(mode.cleaning)
    setAreaSqm(mode.area)
    applyQuickTime(mode.hoursFromNow)
  }

  const numericArea = Math.max(1, parseFloat(areaSqm.replace(',', '.')) || 42)
  const basePrice = Math.max(1500, Math.round(numericArea * 90))
  const typeFactor: Record<CleaningValue, number> = {
    regular: 1,
    deep: 1.55,
    move_in: 1.9,
    move_out: 1.7,
  }
  const livePrice = Math.round(basePrice * typeFactor[cleaningType])
  const liveDurationHours = Math.max(2, Math.round(numericArea / 18))
  const selectedOffer = BOOKING_OFFERS.find((x) => x.value === cleaningType)
  const addressSuggestions = useMemo(() => {
    const q = address.trim().toLowerCase()
    if (q.length < 3) return []
    return CITY_ADDRESS_SUGGESTIONS[cityId].filter((x) => x.toLowerCase().includes(q)).slice(0, 3)
  }, [address, cityId])
  const combinedSuggestions = remoteSuggestions.length > 0 ? remoteSuggestions : addressSuggestions

  useEffect(() => {
    const q = address.trim()
    if (q.length < 3) {
      setRemoteSuggestions([])
      setSuggestLoading(false)
      return
    }

    const timer = setTimeout(() => {
      const controller = new AbortController()
      const run = async () => {
        try {
          setSuggestLoading(true)
          const viewbox = [
            city.longitude - city.longitudeDelta,
            city.latitude + city.latitudeDelta,
            city.longitude + city.longitudeDelta,
            city.latitude - city.latitudeDelta,
          ].join(',')
          const url =
            `https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=5` +
            `&countrycodes=ru&q=${encodeURIComponent(`${q}, ${city.name}`)}` +
            `&viewbox=${encodeURIComponent(viewbox)}&bounded=1`
          const res = await fetch(url, {
            signal: controller.signal,
            headers: {
              Accept: 'application/json',
            },
          })
          if (!res.ok) throw new Error('search failed')
          const rows = (await res.json()) as Array<{ display_name?: string }>
          const mapped = rows
            .map((x) => x.display_name?.split(',').slice(0, 3).join(', ').trim())
            .filter((x): x is string => !!x)
          setRemoteSuggestions(Array.from(new Set(mapped)).slice(0, 5))
        } catch {
          setRemoteSuggestions([])
        } finally {
          setSuggestLoading(false)
        }
      }
      void run()
      return () => controller.abort()
    }, 350)

    return () => clearTimeout(timer)
  }, [address, city.latitude, city.latitudeDelta, city.longitude, city.longitudeDelta, city.name])

  return (
    <View style={styles.root}>
      <View style={styles.screen}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Уборка</Text>
          <Pressable
            style={styles.closeBtn}
            onPress={() => {
              void light()
              router.push('/customer/orders')
            }}
          >
            <Ionicons name="close" size={18} color={theme.color.textMuted} />
          </Pressable>
        </View>
        <Text style={styles.regionSub}>
          {QLIN_REGION_TAGLINE} · {QLIN_CITIES_LINE}
        </Text>
        <Text style={styles.progressText}>Готово шагов: {progressCount}/2</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>{city.nameShort}</Text>
          <Text style={styles.summaryDot}>•</Text>
          <Text style={styles.summaryText}>{selectedOffer?.title ?? 'Уборка'}</Text>
          <Text style={styles.summaryDot}>•</Text>
          <Text style={styles.summaryText}>от {livePrice.toLocaleString('ru-RU')} ₽</Text>
        </View>
        <View style={styles.modeRow}>
          {QUICK_MODES.map((mode) => {
            const active = quickMode === mode.id
            return (
              <Pressable
                key={mode.id}
                style={({ pressed }) => [
                  styles.modeChip,
                  active && styles.modeChipActive,
                  pressed && styles.pressDown,
                ]}
                onPress={() => applyQuickMode(mode)}
              >
                <Text style={[styles.modeChipText, active && styles.modeChipTextActive]}>{mode.label}</Text>
              </Pressable>
            )
          })}
        </View>

        <View style={styles.cityRow}>
          {SERVICE_CITY_IDS.map((id) => {
            const c = SERVICE_CITIES[id]
            const active = cityId === id
            return (
              <Pressable
                key={id}
                onPress={() => {
                  void light()
                  setCityId(id)
                }}
                style={({ pressed }) => [
                  styles.cityPill,
                  active && styles.cityPillActive,
                  pressed && styles.pressDown,
                ]}
              >
                <Text style={[styles.cityPillText, active && styles.cityPillTextActive]}>
                  {c.nameShort}
                </Text>
              </Pressable>
            )
          })}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.offersRow}>
          {BOOKING_OFFERS.map((o) => {
            const active = cleaningType === o.value
            return (
              <Pressable
                key={o.value}
                onPress={() => {
                  void light()
                  setCleaningType(o.value)
                }}
                style={({ pressed }) => [
                  styles.offerCard,
                  active && styles.offerCardActive,
                  pressed && styles.pressDown,
                ]}
              >
                <Text style={styles.offerTitle}>{o.title}</Text>
                <Text style={styles.offerSub}>{o.subtitle}</Text>
                <Text style={styles.offerPrice}>{o.priceHint}</Text>
                {active && (
                  <View style={styles.offerCheck}>
                    <Ionicons name="checkmark" size={18} color="#101010" />
                  </View>
                )}
              </Pressable>
            )
          })}
        </ScrollView>

        <View style={styles.steps}>
          <View style={styles.stepRow}>
            <View style={[styles.stepPlus, addressReady && styles.stepDone]}>
              <Ionicons name={addressReady ? 'checkmark' : 'add'} size={18} color="#101010" />
            </View>
            <View style={styles.stepBody}>
              <TextInput
                style={styles.stepMainInput}
                placeholder={city.addressPlaceholder}
                placeholderTextColor={theme.color.textMuted}
                value={address}
                onChangeText={setAddress}
              />
              {suggestLoading && (
                <View style={styles.suggestLoadingRow}>
                  <Text style={styles.suggestLoadingText}>Ищем адрес…</Text>
                </View>
              )}
              {combinedSuggestions.length > 0 && (
                <View style={styles.suggestWrap}>
                  {combinedSuggestions.map((suggestion) => (
                    <Pressable
                      key={suggestion}
                      style={({ pressed }) => [styles.suggestRow, pressed && styles.suggestRowPressed]}
                      onPress={() => setAddress(suggestion)}
                    >
                      <Ionicons name="location-outline" size={14} color={theme.color.textMuted} />
                      <Text style={styles.suggestText}>{suggestion}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
              <TextInput
                style={styles.stepSubInput}
                placeholder="Укажите квартиру / подъезд"
                placeholderTextColor={theme.color.textMuted}
                value={entrance}
                onChangeText={setEntrance}
              />
              <View style={styles.quickAddressRow}>
                {QUICK_ADDRESS_HINTS.map((hint) => (
                  <Pressable
                    key={hint}
                    style={styles.quickAddressChip}
                    onPress={() => {
                      const trimmed = entrance.trim()
                      setEntrance(trimmed ? `${trimmed}, ${hint}` : hint)
                    }}
                  >
                    <Text style={styles.quickAddressText}>{hint}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.color.textMuted} />
          </View>

          <Pressable style={styles.stepRow} onPress={() => setShowPicker(true)}>
            <View style={[styles.stepPlus, timeReady && styles.stepDone]}>
              <Ionicons name={timeReady ? 'checkmark' : 'add'} size={18} color="#101010" />
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepMain}>Выбрать дату и время</Text>
              <Text style={styles.stepSub}>{scheduled.toLocaleString('ru-RU')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.color.textMuted} />
          </Pressable>
          <View style={styles.quickTimeRow}>
            <Pressable style={styles.quickTimeChip} onPress={() => applyQuickTime(2)}>
              <Text style={styles.quickTimeText}>Через 2 часа</Text>
            </Pressable>
            <Pressable style={styles.quickTimeChip} onPress={() => applyQuickTime(24)}>
              <Text style={styles.quickTimeText}>Завтра утром</Text>
            </Pressable>
            <Pressable style={styles.quickTimeChip} onPress={() => applyQuickTime(30)}>
              <Text style={styles.quickTimeText}>Завтра вечером</Text>
            </Pressable>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepPlus}>
              <Ionicons name="add" size={18} color="#101010" />
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepMain}>Дополнительные параметры</Text>
              <View style={styles.extraInline}>
                <Text style={styles.stepSub}>Площадь:</Text>
                <TextInput
                  style={styles.areaInput}
                  keyboardType="decimal-pad"
                  value={areaSqm}
                  onChangeText={setAreaSqm}
                  placeholder="42"
                />
                <Text style={styles.stepSub}>м²</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.color.textMuted} />
          </View>
        </View>

        {showPicker && (
          <DateTimePicker
            value={scheduled}
            mode="datetime"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, d) => {
              if (Platform.OS === 'android') setShowPicker(false)
              if (d) setScheduled(d)
            }}
          />
        )}

        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.bottomTopRow}>
            <View>
              <Text style={styles.bottomLabel}>Продолжительность уборки</Text>
              <Text style={styles.bottomValue}>от {liveDurationHours} часов</Text>
            </View>
            <Text style={styles.bottomPrice}>от {livePrice.toLocaleString('ru-RU')} ₽</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.cta, !flowReady && styles.ctaDisabled, pressed && flowReady && styles.ctaPressed]}
            onPress={goCheckout}
          >
            <Text style={styles.ctaText}>{flowReady ? 'Продолжить оформление' : 'Заполните адрес и время'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F3F3F3' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 4 },
  screen: { flex: 1, paddingTop: 14, paddingHorizontal: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: theme.fontFamily.semiBold, fontSize: 28, color: '#111' },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E7E7E7',
  },
  regionSub: {
    marginTop: 4,
    marginBottom: 10,
    fontFamily: theme.fontFamily.body,
    color: theme.color.textSecondary,
    fontSize: 12,
  },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  modeChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D5D5D5',
    backgroundColor: '#EFEFEF',
  },
  modeChipActive: {
    borderColor: '#101010',
    backgroundColor: '#101010',
  },
  modeChipText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 12,
    color: '#4B4B4B',
  },
  modeChipTextActive: { color: '#FFF' },
  cityRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  cityPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#E8E8E8',
    borderWidth: 1,
    borderColor: '#DEDEDE',
  },
  cityPillActive: { backgroundColor: '#101010', borderColor: '#101010' },
  cityPillText: { fontFamily: theme.fontFamily.medium, fontSize: 12, color: '#646464' },
  cityPillTextActive: { color: '#FFF' },
  offersRow: { gap: 8, paddingBottom: 12, paddingRight: 10 },
  offerCard: {
    width: 168,
    minHeight: 120,
    borderRadius: 14,
    backgroundColor: '#E9E9E9',
    padding: 12,
    justifyContent: 'space-between',
  },
  offerCardActive: { borderWidth: 1.5, borderColor: '#F6D900' },
  offerTitle: { fontFamily: theme.fontFamily.semiBold, fontSize: 18, color: '#2F2F2F' },
  offerSub: { fontFamily: theme.fontFamily.body, fontSize: 12, color: '#7C7C7C', marginTop: 2 },
  offerPrice: { fontFamily: theme.fontFamily.bold, fontSize: 20, color: '#1B1B1B', marginTop: 10 },
  offerCheck: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F6D900',
    alignItems: 'center',
    justifyContent: 'center',
  },
  steps: { marginTop: 2 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D7D7D7',
  },
  stepPlus: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F6D900',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepDone: { backgroundColor: '#D9F99D' },
  stepBody: { flex: 1 },
  stepMain: { fontFamily: theme.fontFamily.semiBold, fontSize: 18, color: '#222' },
  stepMainInput: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 18,
    color: '#222',
    paddingVertical: 0,
  },
  stepSub: { fontFamily: theme.fontFamily.body, fontSize: 12, color: '#8D8D8D', marginTop: 2 },
  stepSubInput: {
    fontFamily: theme.fontFamily.body,
    fontSize: 12,
    color: '#8D8D8D',
    marginTop: 2,
    paddingVertical: 0,
  },
  quickAddressRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  quickAddressChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D5D5D5',
    backgroundColor: '#EFEFEF',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  quickAddressText: { fontFamily: theme.fontFamily.medium, fontSize: 11, color: '#505050' },
  extraInline: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  quickTimeRow: { flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 2, paddingLeft: 48 },
  quickTimeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D5D5D5',
    backgroundColor: '#EFEFEF',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickTimeText: { fontFamily: theme.fontFamily.medium, fontSize: 11, color: '#3E3E3E' },
  areaInput: {
    fontFamily: theme.fontFamily.semiBold,
    minWidth: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#BFBFBF',
    paddingVertical: 2,
    fontSize: 14,
    textAlign: 'center',
    color: '#2C2C2C',
  },
  bottomBar: { marginTop: 'auto', paddingTop: 8 },
  bottomTopRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  bottomLabel: { fontFamily: theme.fontFamily.body, fontSize: 13, color: '#929292' },
  bottomValue: { fontFamily: theme.fontFamily.bold, fontSize: 22, color: '#1B1B1B', marginTop: 2 },
  bottomPrice: { fontFamily: theme.fontFamily.bold, fontSize: 28, color: '#1B1B1B' },
  progressText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 12,
    color: '#6D6D6D',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#EDEDED',
    marginBottom: 10,
  },
  summaryText: { fontFamily: theme.fontFamily.medium, fontSize: 12, color: '#424242' },
  summaryDot: { marginHorizontal: 6, color: '#8A8A8A' },
  pressDown: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  suggestWrap: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
  },
  suggestLoadingRow: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F2F2F2',
  },
  suggestLoadingText: {
    fontFamily: theme.fontFamily.body,
    fontSize: 12,
    color: '#737373',
  },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E3E3E3',
  },
  suggestRowPressed: { backgroundColor: '#F1F1F1' },
  suggestText: { flex: 1, fontFamily: theme.fontFamily.body, fontSize: 12, color: '#4E4E4E' },
  cta: {
    backgroundColor: '#F6D900',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  ctaDisabled: { opacity: 0.55 },
  ctaPressed: { opacity: 0.92 },
  ctaText: { fontFamily: theme.fontFamily.semiBold, fontSize: 16, color: '#141414' },
})
