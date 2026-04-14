import { useLayoutEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { Link, Redirect, useNavigation, useRouter } from 'expo-router'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { light } from '@/lib/haptics'
import { greetingName, userInitials } from '@/lib/profile-display'
import type { OrderDetail } from '@/types/order'
import { orderStatusLabel } from '@/lib/order-labels'
import { OrderListSkeleton } from '@/components/order-list-skeleton'
import { theme } from '@/theme/tokens'

/** Список заказов клиента — открывается из главного экрана «Заказ». */
export default function CustomerOrdersScreen() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const navigation = useNavigation()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      const { data: rows } = await api.get<OrderDetail[]>('/orders', { params: { limit: 50 } })
      return rows
    },
    enabled: !!user,
  })

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Мои заказы',
      headerRight: () => (
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => {
              void light()
              router.push('/customer')
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 6 }}
            style={styles.headerIconBtn}
            accessibilityLabel="Новый заказ"
          >
            <Ionicons name="add-circle-outline" size={28} color={theme.color.primary} />
          </Pressable>
          <Pressable
            onPress={() => {
              void light()
              router.push('/customer/profile')
            }}
            hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
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

  if (user.role === 'cleaner') {
    return <Redirect href="/cleaner" />
  }

  const name = greetingName(user)
  const ordersCount = data?.length ?? 0
  const showInitialSkeleton = isLoading && data === undefined

  return (
    <View style={styles.wrap}>
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        onRefresh={() => refetch()}
        refreshing={isLoading && data !== undefined}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <Pressable
              style={({ pressed }) => [styles.profileRow, pressed && styles.profileRowPressed]}
              onPress={() => {
                void light()
                router.push('/customer/profile')
              }}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{userInitials(user)}</Text>
              </View>
              <View style={styles.profileText}>
                <Text style={styles.greeting}>Здравствуйте, {name}</Text>
                <Text style={styles.phoneLine}>
                  {user.phone} · <Text style={styles.muted}>личный кабинет</Text>
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={theme.color.textMuted} />
            </Pressable>
            <Text style={styles.lead}>
              Заказы по Хабаровску и Южно-Сахалинску — оплата и детали визита здесь.
            </Text>

            <View style={styles.quickRow}>
              <Link href="/customer" asChild>
                <Pressable
                  style={({ pressed }) => [styles.quickPrimary, pressed && styles.quickPressed]}
                >
                  <Text style={styles.quickPrimaryTitle}>Новый заказ</Text>
                  <Text style={styles.quickPrimarySub}>Карта и оформление</Text>
                </Pressable>
              </Link>
              <Link href="/map-preview" asChild>
                <Pressable
                  style={({ pressed }) => [styles.quickSecondary, pressed && styles.quickPressed]}
                >
                  <Text style={styles.quickSecondaryTitle}>Карта</Text>
                  <Text style={styles.quickSecondarySub}>Яндекс</Text>
                </Pressable>
              </Link>
            </View>

            <Link href="/customer/profile" asChild>
              <Pressable
                style={({ pressed }) => [styles.profileLink, pressed && styles.profileLinkPressed]}
              >
                <Ionicons name="settings-outline" size={22} color={theme.color.primaryDark} />
                <Text style={styles.profileLinkText}>Профиль и данные аккаунта</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.color.textMuted} />
              </Pressable>
            </Link>

            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Ваши заказы</Text>
              {!isLoading && !error && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{ordersCount}</Text>
                </View>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          !isLoading && !error ? (
            <View style={styles.emptyBox}>
              <Ionicons name="document-text-outline" size={40} color={theme.color.borderStrong} />
              <Text style={styles.emptyTitle}>Пока нет заказов</Text>
              <Text style={styles.emptySub}>Создайте первый на главном экране</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          showInitialSkeleton ? (
            <OrderListSkeleton />
          ) : error ? (
            <Text style={styles.err}>
              Не удалось загрузить заказы. Проверьте интернет и адрес API в настройках.
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => {
              void light()
              router.push(`/customer/order/${item.id}`)
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
  phoneLine: {
    fontFamily: theme.fontFamily.body,
    marginTop: 4,
    fontSize: theme.font.small,
    color: theme.color.textSecondary,
  },
  muted: { fontFamily: theme.fontFamily.body, color: theme.color.textMuted },
  lead: {
    fontFamily: theme.fontFamily.body,
    marginTop: theme.space.lg,
    fontSize: theme.font.small,
    color: theme.color.textSecondary,
    lineHeight: 20,
  },
  quickRow: {
    flexDirection: 'row',
    gap: theme.space.md,
    marginTop: theme.space.lg,
  },
  quickPrimary: {
    flex: 1,
    backgroundColor: theme.color.primary,
    padding: theme.space.lg,
    borderRadius: theme.radius.lg,
    ...theme.shadow.soft,
  },
  quickPressed: { opacity: 0.94 },
  quickPrimaryTitle: {
    fontFamily: theme.fontFamily.extraBold,
    color: theme.color.onPrimary,
    fontSize: theme.font.body,
  },
  quickPrimarySub: {
    fontFamily: theme.fontFamily.body,
    color: 'rgba(255,255,255,0.9)',
    fontSize: theme.font.caption,
    marginTop: 4,
  },
  quickSecondary: {
    width: 112,
    backgroundColor: theme.color.bgElevated,
    padding: theme.space.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border,
    justifyContent: 'center',
  },
  quickSecondaryTitle: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.font.body,
    color: theme.color.text,
  },
  quickSecondarySub: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.font.caption,
    color: theme.color.textSecondary,
    marginTop: 4,
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
    lineHeight: 20,
  },
})
