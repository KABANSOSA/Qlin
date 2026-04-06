import { useQuery } from '@tanstack/react-query'
import { Link, Redirect } from 'expo-router'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import type { OrderRow } from '@/types/order'

export default function CustomerOrdersScreen() {
  const { user, logout } = useAuth()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      const { data: rows } = await api.get<OrderRow[]>('/orders', { params: { limit: 50 } })
      return rows
    },
    enabled: !!user,
  })

  if (!user) {
    return <Redirect href="/login" />
  }

  if (user.role === 'cleaner') {
    return <Redirect href="/cleaner" />
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.toolbar}>
        <Text style={styles.role}>Клиент · {user.phone}</Text>
        <Pressable onPress={() => void logout()}>
          <Text style={styles.link}>Выйти</Text>
        </Pressable>
      </View>
      <Link href="/map-preview" asChild>
        <Pressable style={styles.mapLink}>
          <Text style={styles.mapLinkText}>Карта (Yandex MapKit) — заглушка</Text>
        </Pressable>
      </Link>

      {isLoading && <ActivityIndicator style={{ marginTop: 24 }} />}
      {error && (
        <Text style={styles.err}>Не удалось загрузить заказы. Проверьте EXPO_PUBLIC_API_URL и сеть.</Text>
      )}
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        onRefresh={() => refetch()}
        refreshing={isLoading}
        ListEmptyComponent={
          !isLoading && !error ? <Text style={styles.empty}>Пока нет заказов</Text> : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.orderNum}>{item.order_number}</Text>
            <Text style={styles.addr}>{item.address}</Text>
            <Text style={styles.meta}>
              {item.status} · {item.scheduled_at?.slice(0, 16)}
            </Text>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f8f8f8' },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  role: { fontSize: 13, color: '#444' },
  link: { color: '#0066cc', fontSize: 15 },
  mapLink: { padding: 12, backgroundColor: '#eef6ff', marginHorizontal: 16, marginTop: 12, borderRadius: 8 },
  mapLinkText: { color: '#0066cc', textAlign: 'center' },
  err: { padding: 16, color: '#b00020' },
  empty: { padding: 24, textAlign: 'center', color: '#888' },
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  orderNum: { fontWeight: '700', fontSize: 16 },
  addr: { marginTop: 6, fontSize: 15 },
  meta: { marginTop: 6, fontSize: 13, color: '#666' },
})
