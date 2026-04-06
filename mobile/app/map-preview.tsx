import { ScrollView, StyleSheet, Text, View } from 'react-native'

/**
 * Нативная Yandex MapKit: установите react-native-yamap-plus (или react-native-yamap),
 * соберите development build (expo prebuild / EAS Build) — не работает в Expo Go.
 */
export default function MapPreviewScreen() {
  return (
    <ScrollView contentContainerStyle={styles.box}>
      <Text style={styles.h}>Карта</Text>
      <Text style={styles.p}>
        Подключение: пакет вроде <Text style={styles.code}>react-native-yamap-plus</Text>, ключи iOS/Android в
        кабинете Яндекса, инициализация SDK в корне приложения.
      </Text>
      <Text style={styles.p}>
        См. <Text style={styles.code}>mobile/README.md</Text> — раздел «Yandex MapKit».
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  box: { padding: 20 },
  h: { fontSize: 28, fontWeight: '700', marginBottom: 12 },
  p: { fontSize: 15, lineHeight: 22, color: '#333', marginBottom: 12 },
  code: { fontFamily: 'monospace', backgroundColor: '#eee', paddingHorizontal: 4 },
})
