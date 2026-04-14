import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, Redirect } from 'expo-router'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { isAxiosError } from 'axios'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import type { OrderDetail } from '@/types/order'
import { cleaningTypeLabel, orderStatusLabel } from '@/lib/order-labels'
import { theme } from '@/theme/tokens'

function money(v: string | number | undefined): string {
  if (v == null) return '—'
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (Number.isNaN(n)) return String(v)
  return `${Math.round(n).toLocaleString('ru-RU')} ₽`
}

export default function CleanerOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const qc = useQueryClient()

  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: ['order-cleaner', id, user?.id],
    queryFn: async () => {
      const { data } = await api.get<OrderDetail>(`/orders/${id}`)
      return data
    },
    enabled: !!user && user.role === 'cleaner' && !!id,
  })

  const startMut = useMutation({
    mutationFn: async () => {
      await api.post(`/orders/${id}/start`)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['orders-cleaner'] })
      void qc.invalidateQueries({ queryKey: ['orders-available'] })
      void refetch()
    },
    onError: (e: unknown) => {
      let msg = 'Не удалось начать уборку'
      if (isAxiosError(e)) {
        const d = e.response?.data as { detail?: string } | undefined
        if (typeof d?.detail === 'string') msg = d.detail
      }
      Alert.alert('Ошибка', msg)
    },
  })

  const acceptMut = useMutation({
    mutationFn: async () => {
      await api.post(`/orders/${id}/accept`)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['orders-available'] })
      void qc.invalidateQueries({ queryKey: ['orders-cleaner'] })
      void refetch()
    },
    onError: (e: unknown) => {
      let msg = 'Не удалось принять заказ'
      if (isAxiosError(e)) {
        const d = e.response?.data as { detail?: string } | undefined
        if (typeof d?.detail === 'string') msg = d.detail
      }
      Alert.alert('Ошибка', msg)
    },
  })

  const completeMut = useMutation({
    mutationFn: async () => {
      await api.post(`/orders/${id}/complete`)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['orders-cleaner'] })
      void qc.invalidateQueries({ queryKey: ['orders-available'] })
      void refetch()
    },
    onError: (e: unknown) => {
      let msg = 'Не удалось завершить уборку'
      if (isAxiosError(e)) {
        const d = e.response?.data as { detail?: string } | undefined
        if (typeof d?.detail === 'string') msg = d.detail
      }
      Alert.alert('Ошибка', msg)
    },
  })

  if (!user) {
    return <Redirect href="/login" />
  }
  if (user.role !== 'cleaner') {
    return <Redirect href="/customer" />
  }

  if (isLoading || !order) {
    return (
      <View style={styles.center}>
        {isLoading ? <ActivityIndicator size="large" /> : null}
        {error && <Text style={styles.err}>Не удалось загрузить заказ</Text>}
      </View>
    )
  }

  const showAccept = order.status === 'pending' && !order.cleaner_id
  const showStart = order.status === 'assigned'
  const showComplete = order.status === 'in_progress'

  return (
    <ScrollView contentContainerStyle={styles.box}>
      <Text style={styles.num}>{order.order_number}</Text>
      <Text style={styles.status}>{orderStatusLabel(order.status)}</Text>

      <Text style={styles.addr}>{order.address}</Text>
      {order.apartment ? <Text style={styles.meta}>Подъезд/кв.: {order.apartment}</Text> : null}

      <Row label="Тип" value={cleaningTypeLabel(order.cleaning_type)} />
      <Row label="Время" value={order.scheduled_at?.replace('T', ' ').slice(0, 16) ?? '—'} />
      <Row label="Сумма" value={money(order.total_price)} />

      {order.special_instructions ? (
        <View style={styles.block}>
          <Text style={styles.label}>Комментарий клиента</Text>
          <Text style={styles.val}>{order.special_instructions}</Text>
        </View>
      ) : null}

      {showAccept && (
        <Pressable
          style={[styles.accept, acceptMut.isPending && styles.disabled]}
          disabled={acceptMut.isPending}
          onPress={() => {
            Alert.alert('Принять заказ?', 'Заказ закрепится за вами.', [
              { text: 'Отмена', style: 'cancel' },
              { text: 'Принять', onPress: () => acceptMut.mutate() },
            ])
          }}
        >
          <Text style={styles.acceptText}>{acceptMut.isPending ? '…' : 'Принять заказ'}</Text>
        </Pressable>
      )}

      {showStart && (
        <Pressable
          style={[styles.primary, startMut.isPending && styles.disabled]}
          disabled={startMut.isPending}
          onPress={() => {
            Alert.alert('Начать уборку?', undefined, [
              { text: 'Отмена', style: 'cancel' },
              { text: 'Начать', onPress: () => startMut.mutate() },
            ])
          }}
        >
          <Text style={styles.primaryText}>{startMut.isPending ? '…' : 'Начать уборку'}</Text>
        </Pressable>
      )}

      {showComplete && (
        <Pressable
          style={[styles.success, completeMut.isPending && styles.disabled]}
          disabled={completeMut.isPending}
          onPress={() => {
            Alert.alert('Завершить уборку?', undefined, [
              { text: 'Отмена', style: 'cancel' },
              { text: 'Готово', onPress: () => completeMut.mutate() },
            ])
          }}
        >
          <Text style={styles.successText}>{completeMut.isPending ? '…' : 'Завершить уборку'}</Text>
        </Pressable>
      )}
    </ScrollView>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.val}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: theme.color.bg,
  },
  err: {
    fontFamily: theme.fontFamily.body,
    color: theme.color.error,
    marginTop: 8,
  },
  box: { padding: theme.space.lg, paddingBottom: 40, backgroundColor: theme.color.bg },
  num: {
    fontFamily: theme.fontFamily.extraBold,
    fontSize: theme.font.subtitle,
    color: theme.color.text,
  },
  status: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.font.body,
    color: theme.color.primary,
    marginTop: 4,
  },
  addr: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.font.body,
    marginTop: 12,
    marginBottom: 4,
    lineHeight: 22,
    color: theme.color.text,
  },
  meta: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.font.small,
    color: theme.color.textSecondary,
    marginBottom: 12,
  },
  row: { marginBottom: 10 },
  block: { marginTop: 8, marginBottom: 16 },
  label: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.font.caption,
    color: theme.color.textSecondary,
  },
  val: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.font.body,
    marginTop: 2,
    color: theme.color.text,
  },
  accept: {
    marginTop: 20,
    padding: 16,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.primary,
    alignItems: 'center',
  },
  acceptText: {
    fontFamily: theme.fontFamily.semiBold,
    color: theme.color.onPrimary,
    fontSize: theme.font.body,
  },
  primary: {
    marginTop: 20,
    padding: 16,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.primary,
    alignItems: 'center',
  },
  primaryText: {
    fontFamily: theme.fontFamily.bold,
    color: theme.color.onPrimary,
    fontSize: theme.font.body,
  },
  success: {
    marginTop: 12,
    padding: 16,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.success,
    alignItems: 'center',
  },
  successText: {
    fontFamily: theme.fontFamily.bold,
    color: theme.color.onPrimary,
    fontSize: theme.font.body,
  },
  disabled: { opacity: 0.55 },
})
