import { useState } from 'react'
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
import * as AppleAuthentication from 'expo-apple-authentication'
import { Redirect, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth-context'
import { light, success } from '@/lib/haptics'
import { theme } from '@/theme/tokens'

type AuthTab = 'password' | 'otp'

export default function LoginScreen() {
  const { user, login, requestOtp, loginWithOtp, loginWithAppleIdentityToken } = useAuth()
  const router = useRouter()

  const [tab, setTab] = useState<AuthTab>('password')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [busy, setBusy] = useState(false)
  const insets = useSafeAreaInsets()

  if (user) {
    return <Redirect href="/" />
  }

  const goHome = async () => {
    await success()
    router.replace('/')
  }

  const onPasswordLogin = async () => {
    if (!phone.trim() || !password) {
      Alert.alert('Вход', 'Укажите телефон и пароль')
      return
    }
    setBusy(true)
    try {
      await login(phone.trim(), password)
      await goHome()
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined
      Alert.alert('Ошибка', typeof msg === 'string' ? msg : 'Не удалось войти')
    } finally {
      setBusy(false)
    }
  }

  const onRequestOtp = async () => {
    if (!phone.trim()) {
      Alert.alert('SMS', 'Укажите телефон')
      return
    }
    setBusy(true)
    try {
      const data = await requestOtp(phone.trim())
      const hint = data.dev_code ? ` (код для отладки: ${data.dev_code})` : ''
      Alert.alert('Код', `Запрос отправлен.${hint}`)
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined
      Alert.alert('Ошибка', typeof msg === 'string' ? msg : 'Не удалось отправить код')
    } finally {
      setBusy(false)
    }
  }

  const onOtpLogin = async () => {
    if (!phone.trim() || !otpCode.trim()) {
      Alert.alert('SMS', 'Телефон и код из SMS')
      return
    }
    setBusy(true)
    try {
      await loginWithOtp(phone.trim(), otpCode.trim())
      await goHome()
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined
      Alert.alert('Ошибка', typeof msg === 'string' ? msg : 'Неверный код')
    } finally {
      setBusy(false)
    }
  }

  const onApple = async () => {
    try {
      const cred = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })
      if (!cred.identityToken) {
        Alert.alert('Apple', 'Нет identityToken')
        return
      }
      setBusy(true)
      await loginWithAppleIdentityToken(cred.identityToken)
      await goHome()
    } catch (e: unknown) {
      if ((e as { code?: string }).code === 'ERR_CANCELED') return
      Alert.alert('Apple', 'Не удалось войти через Apple')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + theme.space.xxl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Text style={styles.brand}>QLIN</Text>
            <Text style={styles.tagline}>Вход</Text>
            <Text style={styles.heroHint}>Тот же аккаунт, что на сайте. Хабаровск и Южно-Сахалинск.</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.tabs}>
              <Pressable
                onPress={() => {
                  void light()
                  setTab('password')
                }}
                style={({ pressed }) => [styles.tab, tab === 'password' && styles.tabActive, pressed && { opacity: 0.85 }]}
              >
                <Text style={[styles.tabText, tab === 'password' && styles.tabTextActive]}>Пароль</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  void light()
                  setTab('otp')
                }}
                style={({ pressed }) => [styles.tab, tab === 'otp' && styles.tabActive, pressed && { opacity: 0.85 }]}
              >
                <Text style={[styles.tabText, tab === 'otp' && styles.tabTextActive]}>Код из SMS</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Телефон</Text>
            <TextInput
              style={styles.input}
              placeholder="+7 900 000-00-00"
              placeholderTextColor={theme.color.textMuted}
              keyboardType="phone-pad"
              autoCapitalize="none"
              value={phone}
              onChangeText={setPhone}
            />

            {tab === 'password' ? (
              <>
                <Text style={styles.label}>Пароль</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={theme.color.textMuted}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    busy && styles.disabled,
                    pressed && !busy && styles.primaryBtnPressed,
                  ]}
                  onPress={() => void onPasswordLogin()}
                  disabled={busy}
                >
                  <Text style={styles.primaryBtnText}>{busy ? 'Вход…' : 'Войти'}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  style={({ pressed }) => [styles.outlineBtn, busy && styles.disabled, pressed && { opacity: 0.9 }]}
                  onPress={() => void onRequestOtp()}
                  disabled={busy}
                >
                  <Text style={styles.outlineBtnText}>Получить код</Text>
                </Pressable>
                <Text style={styles.label}>Код из SMS</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0000"
                  placeholderTextColor={theme.color.textMuted}
                  keyboardType="number-pad"
                  value={otpCode}
                  onChangeText={setOtpCode}
                />
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    busy && styles.disabled,
                    pressed && !busy && styles.primaryBtnPressed,
                  ]}
                  onPress={() => void onOtpLogin()}
                  disabled={busy}
                >
                  <Text style={styles.primaryBtnText}>{busy ? 'Вход…' : 'Войти по коду'}</Text>
                </Pressable>
              </>
            )}
          </View>

          {Platform.OS === 'ios' && (
            <View style={styles.appleWrap}>
              <Text style={styles.dividerText}>или</Text>
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={theme.radius.lg}
                style={styles.apple}
                onPress={() => void onApple()}
              />
            </View>
          )}

          <Text style={styles.footer}>Продолжая, вы принимаете условия сервиса</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.bg },
  flex: { flex: 1 },
  scroll: {},
  hero: {
    paddingHorizontal: theme.space.xl,
    paddingTop: theme.space.xl,
    paddingBottom: theme.space.lg,
  },
  brand: {
    fontFamily: theme.fontFamily.display,
    fontSize: 40,
    color: theme.color.text,
    letterSpacing: 6,
  },
  tagline: {
    marginTop: theme.space.sm,
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.font.subtitle,
    color: theme.color.textSecondary,
  },
  heroHint: {
    marginTop: theme.space.md,
    fontFamily: theme.fontFamily.body,
    fontSize: theme.font.small,
    color: theme.color.textMuted,
    lineHeight: 20,
    maxWidth: 320,
  },
  card: {
    marginHorizontal: theme.space.lg,
    marginTop: theme.space.sm,
    backgroundColor: theme.color.bgElevated,
    borderRadius: theme.radius.lg,
    padding: theme.space.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.border,
    ...theme.shadow.soft,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: theme.color.bg,
    borderRadius: theme.radius.md,
    padding: 4,
    marginBottom: theme.space.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.space.sm + 2,
    alignItems: 'center',
    borderRadius: theme.radius.sm + 2,
  },
  tabActive: {
    backgroundColor: theme.color.bgElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.border,
  },
  tabText: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: theme.font.small,
    color: theme.color.textSecondary,
  },
  tabTextActive: {
    color: theme.color.primary,
  },
  label: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: theme.font.caption,
    color: theme.color.textSecondary,
    marginBottom: theme.space.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    fontFamily: theme.fontFamily.body,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.space.lg,
    paddingVertical: 14,
    fontSize: theme.font.body,
    color: theme.color.text,
    backgroundColor: theme.color.bgMuted,
    marginBottom: theme.space.md,
  },
  primaryBtn: {
    backgroundColor: theme.color.primary,
    paddingVertical: 16,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginTop: theme.space.sm,
  },
  primaryBtnPressed: { opacity: 0.92 },
  primaryBtnText: {
    fontFamily: theme.fontFamily.semiBold,
    color: theme.color.onPrimary,
    fontSize: theme.font.body,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: theme.color.borderStrong,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginBottom: theme.space.md,
  },
  outlineBtnText: {
    fontFamily: theme.fontFamily.semiBold,
    color: theme.color.text,
    fontSize: theme.font.body,
  },
  disabled: { opacity: 0.55 },
  appleWrap: {
    marginHorizontal: theme.space.lg,
    marginTop: theme.space.lg,
    alignItems: 'center',
  },
  dividerText: {
    fontSize: theme.font.caption,
    color: theme.color.textMuted,
    marginBottom: theme.space.md,
  },
  apple: { width: '100%', height: 48 },
  footer: {
    fontFamily: theme.fontFamily.body,
    textAlign: 'center',
    marginTop: theme.space.xl,
    marginHorizontal: theme.space.xl,
    fontSize: theme.font.caption,
    color: theme.color.textMuted,
    lineHeight: 18,
  },
})
