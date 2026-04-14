import { useState } from 'react'
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { DEFAULT_SERVICE_CITY_ID, SERVICE_CITIES } from '@/lib/service-cities'
import { theme } from '@/theme/tokens'

const DEFAULT_MAP_QUERY = SERVICE_CITIES[DEFAULT_SERVICE_CITY_ID].name

/**
 * Открытие адреса в Яндекс.Картах в браузере (без нативного MapKit).
 */
export default function MapPreviewScreen() {
  const [q, setQ] = useState('')

  const openYandexMaps = () => {
    const text = q.trim() || DEFAULT_MAP_QUERY
    const url = `https://yandex.ru/maps/?text=${encodeURIComponent(text)}`
    void Linking.openURL(url)
  }

  return (
    <ScrollView contentContainerStyle={styles.box}>
      <Text style={styles.h}>Карта</Text>
      <Text style={styles.p}>
        Введите адрес в Хабаровске или Южно-Сахалинске — откроется Яндекс.Карты в браузере.
      </Text>
      <Text style={styles.label}>Адрес или запрос</Text>
      <TextInput
        style={styles.input}
        placeholder="Например: Хабаровск, ул. Муравьёва-Амурского 19"
        value={q}
        onChangeText={setQ}
        multiline
      />
      <Pressable style={styles.btn} onPress={openYandexMaps}>
        <Text style={styles.btnText}>Открыть в Яндекс.Картах</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  box: { padding: theme.space.lg, paddingBottom: 40, backgroundColor: theme.color.bg },
  h: {
    fontFamily: theme.fontFamily.extraBold,
    fontSize: theme.font.title,
    marginBottom: theme.space.sm,
    color: theme.color.text,
  },
  p: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.font.body,
    lineHeight: 24,
    color: theme.color.textSecondary,
    marginBottom: theme.space.lg,
  },
  label: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: theme.font.caption,
    color: theme.color.textSecondary,
    marginBottom: theme.space.sm,
  },
  input: {
    fontFamily: theme.fontFamily.body,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
    padding: 14,
    fontSize: theme.font.body,
    minHeight: 48,
    marginBottom: theme.space.lg,
    backgroundColor: theme.color.bgElevated,
    color: theme.color.text,
  },
  btn: {
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
})
