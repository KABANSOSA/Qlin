import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Constants from 'expo-constants'
import { Ionicons } from '@expo/vector-icons'
import { Redirect, useRouter } from 'expo-router'
import { useAuth } from '@/lib/auth-context'
import { cleanerGreetingName, userInitials } from '@/lib/profile-display'
import { theme } from '@/theme/tokens'
import { light, medium } from '@/lib/haptics'

const SUPPORT_URL = 'https://qlin.pro'

export default function CleanerProfileScreen() {
  const { user, logout } = useAuth()
  const router = useRouter()

  if (!user) {
    return <Redirect href="/login" />
  }

  if (user.role !== 'cleaner') {
    return <Redirect href="/customer" />
  }

  const version =
    Constants.expoConfig?.version ?? (Constants as { nativeAppVersion?: string }).nativeAppVersion ?? '—'

  const onLogout = () => {
    Alert.alert('Выйти из аккаунта?', undefined, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: () => {
          void medium()
          void logout().then(() => router.replace('/login'))
        },
      },
    ])
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{userInitials(user)}</Text>
        </View>
        <Text style={styles.name}>{cleanerGreetingName(user)}</Text>
        <Text style={styles.phone}>{user.phone}</Text>
        {user.email ? <Text style={styles.email}>{user.email}</Text> : null}
        <View style={styles.rolePill}>
          <Text style={styles.rolePillText}>Клинер</Text>
        </View>
      </View>

      <Text style={styles.section}>Сервис</Text>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={() => {
          void light()
          void Linking.openURL(SUPPORT_URL)
        }}
      >
        <Ionicons name="globe-outline" size={22} color={theme.color.primary} />
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle}>Сайт QLIN</Text>
          <Text style={styles.rowSub}>Инструкции и поддержка</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.color.textMuted} />
      </Pressable>

      <Text style={styles.section}>О приложении</Text>
      <View style={styles.metaBox}>
        <Text style={styles.metaLabel}>Версия</Text>
        <Text style={styles.metaValue}>{version}</Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.logout, pressed && styles.logoutPressed]}
        onPress={onLogout}
      >
        <Ionicons name="log-out-outline" size={22} color={theme.color.error} />
        <Text style={styles.logoutText}>Выйти из аккаунта</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  content: { paddingBottom: theme.space.xxl },
  hero: {
    alignItems: 'center',
    paddingVertical: theme.space.xl,
    paddingHorizontal: theme.space.lg,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.color.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.space.md,
  },
  avatarText: {
    fontFamily: theme.fontFamily.extraBold,
    fontSize: 28,
    color: theme.color.primaryDark,
  },
  name: {
    fontFamily: theme.fontFamily.extraBold,
    fontSize: theme.font.title,
    color: theme.color.text,
  },
  phone: {
    fontFamily: theme.fontFamily.body,
    marginTop: 6,
    fontSize: theme.font.body,
    color: theme.color.textSecondary,
  },
  email: {
    fontFamily: theme.fontFamily.body,
    marginTop: 4,
    fontSize: theme.font.small,
    color: theme.color.textSecondary,
  },
  rolePill: {
    marginTop: theme.space.md,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.color.primaryLight,
  },
  rolePillText: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.font.caption,
    color: theme.color.primaryDark,
  },
  section: {
    fontFamily: theme.fontFamily.bold,
    paddingHorizontal: theme.space.lg,
    marginTop: theme.space.lg,
    marginBottom: theme.space.sm,
    fontSize: theme.font.caption,
    color: theme.color.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.space.lg,
    padding: theme.space.lg,
    backgroundColor: theme.color.bgElevated,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border,
    gap: theme.space.md,
    ...theme.shadow.soft,
  },
  rowPressed: { opacity: 0.92 },
  rowBody: { flex: 1 },
  rowTitle: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.font.body,
    color: theme.color.text,
  },
  rowSub: {
    fontFamily: theme.fontFamily.body,
    marginTop: 2,
    fontSize: theme.font.caption,
    color: theme.color.textSecondary,
  },
  metaBox: {
    marginHorizontal: theme.space.lg,
    padding: theme.space.lg,
    backgroundColor: theme.color.bgElevated,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.font.small,
    color: theme.color.textSecondary,
  },
  metaValue: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: theme.font.body,
    color: theme.color.text,
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.sm,
    marginTop: theme.space.xl,
    marginHorizontal: theme.space.lg,
    padding: theme.space.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  logoutPressed: { opacity: 0.9 },
  logoutText: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.font.body,
    color: theme.color.error,
  },
})
