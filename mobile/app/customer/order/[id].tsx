import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as WebBrowser from 'expo-web-browser'
import { useLocalSearchParams, Redirect, Link } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

export default function CustomerOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const qc = useQueryClient()

  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: ['order', id, user?.id],
    queryFn: async () => {
      const { data } = await api.get<OrderDetail>(`/orders/${id}`)
      return data
    },
    enabled: !!user && !!id,
  })

  const [editOpen, setEditOpen] = useState(false)
  const [editAddr, setEditAddr] = useState('')
  const [editInstr, setEditInstr] = useState('')
  const [payBusy, setPayBusy] = useState(false)

  const cancelMut = useMutation({
    mutationFn: async () => {
      await api.post(`/orders/${id}/cancel`)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['orders'] })
      void qc.invalidateQueries({ queryKey: ['order', id] })
      void refetch()
    },
  })

  const patchMut = useMutation({
    mutationFn: async () => {
      const addr = editAddr.trim()
      if (addr.length < 5) {
        throw new Error('Адрес не короче 5 символов')
      }
      await api.patch(`/orders/${id}`, {
        address: addr,
        special_instructions: editInstr.trim() || undefined,
      })
    },
    onSuccess: () => {
      setEditOpen(false)
      void qc.invalidateQueries({ queryKey: ['orders'] })
      void qc.invalidateQueries({ queryKey: ['order', id] })
      void refetch()
    },
    onError: (e: unknown) => {
      let msg = 'Не удалось сохранить'
      if (isAxiosError(e)) {
        const d = e.response?.data as { detail?: string } | undefined
        if (typeof d?.detail === 'string') msg = d.detail
      } else if (e instanceof Error) msg = e.message
      Alert.alert('Ошибка', msg)
    },
  })

  const openPay = async () => {
    setPayBusy(true)
    let confirmationUrl: string | undefined
    try {
      const { data } = await api.post<{ confirmation_url: string }>(
        `/orders/${id}/payment/yookassa`,
      )
      confirmationUrl = data.confirmation_url
      if (!confirmationUrl) {
        Alert.alert('Оплата', 'Сервер не вернул ссылку на оплату')
        return
      }
    } catch (e: unknown) {
      let msg = 'Не удалось начать оплату'
      if (isAxiosError(e)) {
        const d = e.response?.data as { detail?: string } | undefined
        if (typeof d?.detail === 'string') msg = d.detail
      }
      Alert.alert('Оплата', msg)
      return
    } finally {
      setPayBusy(false)
    }

    if (!confirmationUrl) return
    await WebBrowser.openBrowserAsync(confirmationUrl)
    void refetch()
  }

  if (!user) {
    return <Redirect href="/login" />
  }
  if (user.role !== 'customer') {
    return <Redirect href="/cleaner" />
  }

  if (isLoading || !order) {
    return (
      <View style={styles.center}>
        {isLoading ? <ActivityIndicator size="large" /> : null}
        {error && <Text style={styles.err}>Не удалось загрузить заказ</Text>}
      </View>
    )
  }

  const canCancel = order.status === 'pending' || order.status === 'assigned'
  const canEdit = order.status === 'pending'
  const canPay = order.status === 'completed' && order.payment_status !== 'paid'

  return (
    <ScrollView contentContainerStyle={styles.box}>
      <Text style={styles.num}>{order.order_number}</Text>
      <Text style={styles.status}>{orderStatusLabel(order.status)}</Text>

      <Row label="Адрес" value={order.address} />
      {order.apartment ? <Row label="Квартира" value={String(order.apartment)} /> : null}
      <Row label="Тип" value={cleaningTypeLabel(order.cleaning_type)} />
      <Row label="Комнат" value={String(order.rooms_count)} />
      <Row label="Когда" value={order.scheduled_at?.replace('T', ' ').slice(0, 16) ?? '—'} />
      <Row label="Сумма" value={money(order.total_price)} />
      <Row label="Оплата" value={order.payment_status} />

      {order.special_instructions ? (
        <View style={styles.block}>
          <Text style={styles.label}>Комментарий</Text>
          <Text style={styles.val}>{order.special_instructions}</Text>
        </View>
      ) : null}

      <Link href="/map-preview" asChild>
        <Pressable style={styles.secondary}>
          <Text style={styles.secondaryText}>Карта (адрес)</Text>
        </Pressable>
      </Link>

      {canEdit && (
        <Pressable
          style={styles.secondary}
          onPress={() => {
            setEditAddr(order.address)
            setEditInstr(order.special_instructions ?? '')
            setEditOpen(true)
          }}
        >
          <Text style={styles.secondaryText}>Изменить адрес / комментарий</Text>
        </Pressable>
      )}

      {canPay && (
        <Pressable
          style={[styles.pay, payBusy && styles.disabled]}
          disabled={payBusy}
          onPress={() => void openPay()}
        >
          <Text style={styles.payText}>
            {payBusy ? 'Подготовка оплаты…' : 'Оплатить картой (ЮKassa)'}
          </Text>
        </Pressable>
      )}

      <Modal visible={editOpen} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Редактирование</Text>
            <Text style={styles.label}>Адрес</Text>
            <TextInput style={styles.input} value={editAddr} onChangeText={setEditAddr} multiline />
            <Text style={styles.label}>Комментарий</Text>
            <TextInput style={styles.input} value={editInstr} onChangeText={setEditInstr} multiline />
            <View style={styles.modalRow}>
              <Pressable style={styles.modalCancel} onPress={() => setEditOpen(false)}>
                <Text style={styles.modalCancelText}>Отмена</Text>
              </Pressable>
              <Pressable
                style={styles.modalOk}
                disabled={patchMut.isPending}
                onPress={() => patchMut.mutate()}
              >
                <Text style={styles.modalOkText}>{patchMut.isPending ? '…' : 'Сохранить'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {canCancel && (
        <Pressable
          style={[styles.danger, cancelMut.isPending && styles.disabled]}
          disabled={cancelMut.isPending}
          onPress={() => {
            Alert.alert('Отменить заказ?', 'Действие нельзя отменить из приложения.', [
              { text: 'Нет', style: 'cancel' },
              {
                text: 'Да, отменить',
                style: 'destructive',
                onPress: () => cancelMut.mutate(),
              },
            ])
          }}
        >
          <Text style={styles.dangerText}>{cancelMut.isPending ? '…' : 'Отменить заказ'}</Text>
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
    marginBottom: 16,
  },
  row: { marginBottom: 12 },
  block: { marginBottom: 12 },
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
  secondary: {
    marginTop: 16,
    padding: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.primaryLight,
    alignItems: 'center',
  },
  secondaryText: {
    fontFamily: theme.fontFamily.semiBold,
    color: theme.color.primaryDark,
  },
  pay: {
    marginTop: 12,
    padding: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.primary,
    alignItems: 'center',
  },
  payText: {
    fontFamily: theme.fontFamily.bold,
    color: theme.color.onPrimary,
    fontSize: theme.font.body,
  },
  modalBg: {
    flex: 1,
    backgroundColor: theme.color.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: theme.color.bgElevated,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
  },
  modalTitle: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.font.subtitle,
    marginBottom: 12,
    color: theme.color.text,
  },
  input: {
    fontFamily: theme.fontFamily.body,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.sm,
    padding: 10,
    marginBottom: 12,
    minHeight: 44,
    color: theme.color.text,
  },
  modalCancelText: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.font.body,
    color: theme.color.textSecondary,
  },
  modalOkText: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: theme.font.body,
    color: theme.color.onPrimary,
  },
  modalRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  modalCancel: { padding: 10 },
  modalOk: {
    backgroundColor: theme.color.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.sm,
  },
  danger: {
    marginTop: 24,
    padding: 14,
    borderRadius: theme.radius.md,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
  },
  dangerText: {
    fontFamily: theme.fontFamily.semiBold,
    color: theme.color.error,
  },
  disabled: { opacity: 0.55 },
})
