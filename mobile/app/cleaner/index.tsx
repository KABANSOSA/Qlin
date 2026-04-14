import { useLayoutEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { Link, Redirect, useNavigation, useRouter } from 'expo-router'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { light } from '@/lib/haptics'
import { cleanerGreetingName, userInitials } from '@/lib/profile-display'
import type { OrderDetail } from '@/types/order'
import { orderStatusLabel } from '@/lib/order-labels'
import { OrderListSkeleton } from '@/components/order-list-skeleton'
import { theme } from '@/theme/tokens'

export default function CleanerOrdersScreen() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const navigation = useNavigation()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders-cleaner', user?.id],
    queryFn: async () => {
      const { data: rows } = await api.get<OrderDetail[]>('/orders', { params: { limit: 50 } })
      return rows
    },
    enabled: !!user && user.role === 'cleaner',
  })

  const {
    data: available,
    refetch: refetchAvailable,
    isLoading: loadingPool,
  } = useQuery({
    queryKey: ['orders-available', user?.id],
    queryFn: async () => {
      const { data: rows } = await api.get<OrderDetail[]>('/orders/available')
      return rows
    },
    enabled: !!user && user.role === 'cleaner',
  })

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => {
              void light()
              router.push('/cleaner/profile')
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 6 }}
            style={styles.headerIconBtn}
            accessibilityLabel="Профиль"
          >
            <Ionicons name="person-circle-outline" size={28} color={theme.color.primary} />
          </Pressable>
          <Pressable
            onPress={() => void logout()}
            hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
            style={styles.headerTextBtn}
          >
            <Text style={styles.headerBtnText}>Выйти</Text>
          </Pressable>
        </View>
      ),
    })
  }, [navigation, logout, router])

  if (!user) {
    return <Redirect href="/login" />
  }

  if (user.role !== 'cleaner') {
    return <Redirect href="/customer" />
  }

  const name = cleanerGreetingName(user)
  const n = data?.length ?? 0
  const na = available?.length ?? 0
  const showInitialSkeleton = isLoading && data === undefined
  const refreshing = (isLoading && data !== undefined) || loadingPool

  const onRefresh = () => {
    void refetch()
    void refetchAvailable()
  }

  return (
    <View style={styles.wrap}>
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        onRefresh={onRefresh}
        refreshing={refreshing}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <Pressable
              style={({ pressed }) => [styles.profileRow, pressed && styles.profileRowPressed]}
              onPress={() => {
                void light()
                router.push('/cleaner/profile')
              }}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{userInitials(user)}</Text>
              </View>
              <View style={styles.profileText}>
                <Text style={styles.greeting}>{name}</Text>
                <Text style={styles.subLine}>Клинер · {user.phone}</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={theme.color.textMuted} />
            </Pressable>
            <Text style={styles.lead}>
              Свободные заказы — примите в работу. Ниже — заказы, уже назначенные на вас.
            </Text>
            {na > 0 ? (
              <View style={styles.poolBlock}>
                <View style={styles.poolSectionRow}>
                  <Text style={styles.poolSectionTitle}>Свободные</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{na}</Text>
                  </View>
                </View>
                {available!.map((item) => (
                  <Pressable
                    key={item.id}
                    style={({ pressed }) => [styles.poolCard, pressed && styles.cardPressed]}
                    onPress={() => {
                      void light()
                      router.push(`/cleaner/order/${item.id}`)
                    }}
                  >
                    <View style={styles.cardTop}>
                      <Text style={styles.orderNum}>{item.order_number}</Text>
                      <View style={styles.pill}>
                        <Text style={styles.pillText}>{orderStatusLabel(item.status)}</Text>
                      </View>
                    </View>
                    <Text style={styles.addr} numberOfLines={2}>
                      {item.address}
                    </Text>
                    <Text style={styles.meta}>
                      {item.scheduled_at?.replace('T', ' ').slice(0, 16) ?? '—'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <Link href="/map-preview" asChild>
              <Pressable style={({ pressed }) => [styles.mapCard, pressed && styles.mapPressed]}>
                <Text style={styles.mapTitle}>Открыть карту</Text>
                <Text style={styles.mapSub}>Яндекс.Карты — адрес заказа</Text>
              </Pressable>
            </Link>
            <Link href="/cleaner/profile" asChild>
              <Pressable
                style={({ pressed }) => [styles.profileLink, pressed && styles.profileLinkPressed]}
              >
                <Ionicons name="briefcase-outline" size={22} color={theme.color.primaryDark} />
                <Text style={styles.profileLinkText}>Профиль клинера</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.color.textMuted} />
              </Pressable>
            </Link>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Мои заказы</Text>
              {!isLoading && !error && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{n}</Text>
                </View>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          !isLoading && !error ? (
            <View style={styles.emptyBox}>
              <Ionicons name="clipboard-outline" size={40} color={theme.color.borderStrong} />
              <Text style={styles.emptyTitle}>Нет назначенных заказов</Text>
              <Text style={styles.emptySub}>Когда появятся — они отобразятся здесь</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          showInitialSkeleton ? (
            <OrderListSkeleton />
          ) : error ? (
            <Text style={styles.err}>Не удалось загрузить заказы. Проверьте сеть и API.</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => {
              void light()
              router.push(`/cleaner/order/${item.id}`)
            }}
          >
            <View style={styles.cardTop}>
              <Text style={styles.orderNum}>{item.order_number}</Text>
              <View style={styles.pill}>
                <Text style={styles.pillText}>{orderStatusLabel(item.status)}</Text>
              </View>
            </View>
            <Text style={styles.addr} numberOfLines={2}>
              {item.address}
            </Text>
            <Text style={styles.meta}>
              {item.scheduled_at?.replace('T', ' ').slice(0, 16) ?? '—'}
            </Text>
          </Pressable>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.color.bg },
  listContent: { paddingBottom: theme.space.xxl },
  headerBlock: {
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.sm,
    paddingBottom: theme.space.md,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    paddingVertical: theme.space.sm,
  },
  profileRowPressed: { opacity: 0.92 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.color.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: theme.fontFamily.extraBold,
    fontSize: theme.font.subtitle,
    color: theme.color.primaryDark,
  },
  profileText: { flex: 1 },
  greeting: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.font.title,
    color: theme.color.text,
  },
  subLine: {
    fontFamily: theme.fontFamily.body,
    marginTop: 4,
    fontSize: theme.font.small,
    color: theme.color.textSecondary,
  },
  lead: {
    fontFamily: theme.fontFamily.body,
    marginTop: theme.space.lg,
    fontSize: theme.font.small,
    color: theme.color.textSecondary,
    lineHeight: 20,
  },
  poolBlock: {
    marginTop: theme.space.md,
    gap: theme.space.sm,
  },
  poolSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    marginBottom: theme.space.xs,
  },
  poolSectionTitle: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.font.caption,
    color: theme.color.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  poolCard: {
    padding: theme.space.lg,
    backgroundColor: theme.color.bgElevated,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.borderStrong,
    ...theme.shadow.soft,
  },
  mapCard: {
    marginTop: theme.space.lg,
    padding: theme.space.lg,
    backgroundColor: theme.color.bgElevated,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border,
    ...theme.shadow.soft,
  },
  mapPressed: { opacity: 0.94 },
  mapTitle: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.font.body,
    color: theme.color.primaryDark,
  },
  mapSub: {
    fontFamily: theme.fontFamily.body,
    marginTop: 4,
    fontSize: theme.font.caption,
    color: theme.color.textSecondary,
  },
  profileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    marginTop: theme.space.md,
    padding: theme.space.md,
    backgroundColor: theme.color.bgElevated,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border,
  },
  profileLinkPressed: { opacity: 0.92 },
  profileLinkText: {
    fontFamily: theme.fontFamily.semiBold,
    flex: 1,
    fontSize: theme.font.small,
    color: theme.color.text,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    marginTop: theme.space.xl,
    marginBottom: theme.space.sm,
  },
  sectionTitle: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.font.caption,
    color: theme.color.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  badge: {
    backgroundColor: theme.color.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
  },
  badgeText: {
    fontFamily: theme.fontFamily.extraBold,
    fontSize: theme.font.caption,
    color: theme.color.primaryDark,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerIconBtn: { paddingVertical: 4, paddingHorizontal: 4 },
  headerTextBtn: { paddingVertical: 4, paddingLeft: 4, paddingRight: 4 },
  headerBtnText: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: theme.font.body,
    color: theme.color.primary,
  },
  card: {
    marginHorizontal: theme.space.lg,
    marginBottom: theme.space.md,
    padding: theme.space.lg,
    backgroundColor: theme.color.bgElevated,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border,
    ...theme.shadow.soft,
  },
  cardPressed: { opacity: 0.94 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderNum: {
    fontFamily: theme.fontFamily.extraBold,
    fontSize: theme.font.body,
    color: theme.color.text,
  },
  pill: {
    backgroundColor: theme.color.bg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  pillText: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: theme.font.caption,
    color: theme.color.textSecondary,
  },
  addr: {
    fontFamily: theme.fontFamily.body,
    marginTop: theme.space.sm,
    fontSize: theme.font.body,
    color: theme.color.text,
    lineHeight: 22,
  },
  meta: {
    fontFamily: theme.fontFamily.body,
    marginTop: 8,
    fontSize: theme.font.caption,
    color: theme.color.textMuted,
  },
  emptyBox: {
    marginHorizontal: theme.space.lg,
    padding: theme.space.xl,
    alignItems: 'center',
    backgroundColor: theme.color.bgElevated,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderStyle: 'dashed',
    gap: theme.space.sm,
  },
  emptyTitle: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.font.body,
    color: theme.color.text,
  },
  emptySub: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.font.small,
    color: theme.color.textSecondary,
    textAlign: 'center',
  },
  err: {
    fontFamily: theme.fontFamily.body,
    marginHorizontal: theme.space.lg,
    color: theme.color.error,
    fontSize: theme.font.small,
  },
})
