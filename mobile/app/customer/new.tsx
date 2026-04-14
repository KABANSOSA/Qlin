import { useEffect, useState } from 'react'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { parseServiceCityId, serviceCityToApiKey } from '@/lib/service-cities'
import { ZONE_PLACEHOLDER } from '@/types/order'
import { theme } from '@/theme/tokens'

const TYPES = [
  { value: 'regular', label: 'Регулярная' },
  { value: 'deep', label: 'Глубокая' },
  { value: 'move_in', label: 'После въезда' },
  { value: 'move_out', label: 'После выезда' },
]

function defaultTomorrowTen(): Date {
  const t = new Date()
  t.setDate(t.getDate() + 1)
  t.setSeconds(0, 0)
  t.setMilliseconds(0)
  t.setHours(10, 0, 0, 0)
  return t
}

export default function NewOrderScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useLocalSearchParams<{
    address?: string
    cleaningType?: string
    areaSqm?: string
    scheduled?: string
    entrance?: string
    serviceCity?: string
    serviceCityId?: string
  }>()
  const [address, setAddress] = useState('')
  const [cleaningType, setCleaningType] = useState('regular')
  const [rooms, setRooms] = useState('2')
  const [bathrooms, setBathrooms] = useState('1')
  const [areaSqm, setAreaSqm] = useState('')
  const [instructions, setInstructions] = useState('')
  const [scheduled, setScheduled] = useState(() => defaultTomorrowTen())
  const [showPicker, setShowPicker] = useState(false)
  const [busy, setBusy] = useState(false)
  const [serviceCityLabel, setServiceCityLabel] = useState<string | null>(null)

  useEffect(() => {
    if (typeof params.address === 'string' && params.address.length > 0) {
      setAddress(params.address)
    }
    if (typeof params.cleaningType === 'string' && params.cleaningType.length > 0) {
      setCleaningType(params.cleaningType)
    }
    if (typeof params.areaSqm === 'string' && params.areaSqm.length > 0) {
      setAreaSqm(params.areaSqm)
    }
    if (typeof params.scheduled === 'string') {
      const d = new Date(params.scheduled)
      if (!Number.isNaN(d.getTime()) && d.getTime() > Date.now() - 86400000) {
        setScheduled(d)
      }
    }
    if (typeof params.entrance === 'string' && params.entrance.trim().length > 0) {
      const e = params.entrance.trim()
      setInstructions((prev) =>
        prev.trim() ? `Подъезд/домофон: ${e}. ${prev}` : `Подъезд/домофон: ${e}`,
      )
    }
    if (typeof params.serviceCity === 'string' && params.serviceCity.trim().length > 0) {
      setServiceCityLabel(params.serviceCity.trim())
    }
  }, [
    params.address,
    params.cleaningType,
    params.areaSqm,
    params.scheduled,
    params.entrance,
    params.serviceCity,
  ])

  if (!user) {
    return <Redirect href="/login" />
  }
  if (user.role !== 'customer') {
    return <Redirect href="/cleaner" />
  }

  const submit = async () => {
    const addr = address.trim()
    if (addr.length < 5) {
      Alert.alert('Адрес', 'Укажите полный адрес (не короче 5 символов)')
      return
    }
    if (scheduled.getTime() <= Date.now()) {
      Alert.alert('Время', 'Выберите дату и время визита в будущем')
      return
    }
    const rc = Math.max(1, parseInt(rooms, 10) || 1)
    const bc = Math.max(0, parseInt(bathrooms, 10) || 0)
    let area: number | undefined
    if (areaSqm.trim()) {
      const a = parseFloat(areaSqm.replace(',', '.'))
      if (!Number.isNaN(a) && a > 0) area = a
    }
    setBusy(true)
    try {
      const scheduled_at = scheduled.toISOString()
      const cityLine = serviceCityLabel ? `Город обслуживания: ${serviceCityLabel}.` : ''
      const special =
        [cityLine, instructions.trim()].filter((s) => s.length > 0).join('\n') || undefined
      const cityId = parseServiceCityId(
        typeof params.serviceCityId === 'string' ? params.serviceCityId : undefined,
      )
      const { data } = await api.post<{ id: string }>('/orders', {
        zone_id: ZONE_PLACEHOLDER,
        service_city: serviceCityToApiKey(cityId),
        address: addr,
        cleaning_type: cleaningType,
        rooms_count: rc,
        bathrooms_count: bc,
        area_sqm: area,
        has_pets: false,
        has_balcony: false,
        special_instructions: special,
        scheduled_at,
      })
      Alert.alert('Готово', 'Заказ создан', [
        { text: 'OK', onPress: () => router.replace(`/customer/order/${data.id}`) },
      ])
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { detail?: unknown } } }).response?.data?.detail
          : undefined
      const text =
        typeof msg === 'string'
          ? msg
          : Array.isArray(msg)
            ? msg.map((x: { msg?: string }) => x.msg).join(', ')
            : 'Не удалось создать заказ'
      Alert.alert('Ошибка', text)
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.box} keyboardShouldPersistTaps="handled">
        <Text style={styles.hint}>
          {serviceCityLabel
            ? `Заказ в ${serviceCityLabel}. Уточните адрес и детали — клинер увидит всё в заявке.`
            : 'Укажите адрес в Хабаровске или Южно-Сахалинске. Детали можно дополнить ниже.'}
        </Text>

        <Text style={styles.label}>Дата и время визита</Text>
        <Pressable style={styles.input} onPress={() => setShowPicker(true)}>
          <Text style={styles.inputInner}>{scheduled.toLocaleString('ru-RU')}</Text>
        </Pressable>
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

        <Text style={styles.label}>Адрес *</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="Город, улица, дом, квартира"
          multiline
        />

        <Text style={styles.label}>Тип уборки</Text>
        <View style={styles.chips}>
          {TYPES.map((t) => (
            <Pressable
              key={t.value}
              onPress={() => setCleaningType(t.value)}
              style={[styles.chip, cleaningType === t.value && styles.chipOn]}
            >
              <Text style={[styles.chipText, cleaningType === t.value && styles.chipTextOn]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Комнат</Text>
        <TextInput style={styles.input} value={rooms} onChangeText={setRooms} keyboardType="number-pad" />

        <Text style={styles.label}>Санузлов</Text>
        <TextInput style={styles.input} value={bathrooms} onChangeText={setBathrooms} keyboardType="number-pad" />

        <Text style={styles.label}>Площадь м² (необязательно)</Text>
        <TextInput
          style={styles.input}
          value={areaSqm}
          onChangeText={setAreaSqm}
          keyboardType="decimal-pad"
          placeholder="Например 45"
        />

        <Text style={styles.label}>Комментарий</Text>
        <TextInput
          style={[styles.input, styles.ta]}
          value={instructions}
          onChangeText={setInstructions}
          multiline
          placeholder="Домофон, ключи…"
        />

        <Pressable style={[styles.btn, busy && styles.disabled]} disabled={busy} onPress={() => void submit()}>
          <Text style={styles.btnText}>{busy ? '…' : 'Оформить заказ'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  box: { padding: theme.space.lg, paddingBottom: 40, backgroundColor: theme.color.bg },
  hint: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.font.small,
    color: theme.color.textSecondary,
    marginBottom: theme.space.lg,
    lineHeight: 20,
  },
  label: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: theme.font.caption,
    color: theme.color.textSecondary,
    marginBottom: theme.space.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    fontFamily: theme.fontFamily.body,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: theme.space.md,
    fontSize: theme.font.body,
    backgroundColor: theme.color.bgElevated,
    color: theme.color.text,
  },
  inputInner: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.font.body,
    color: theme.color.text,
  },
  ta: { minHeight: 80, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: theme.space.md },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.color.bg,
    borderWidth: 1,
    borderColor: theme.color.border,
  },
  chipOn: { backgroundColor: theme.color.primary, borderColor: theme.color.primary },
  chipText: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.font.small,
    color: theme.color.text,
  },
  chipTextOn: { color: theme.color.onPrimary },
  btn: {
    marginTop: theme.space.md,
    backgroundColor: theme.color.primary,
    padding: 16,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  btnText: {
    fontFamily: theme.fontFamily.semiBold,
    color: theme.color.onPrimary,
    fontSize: theme.font.body,
  },
  disabled: { opacity: 0.55 },
})
