import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { theme } from '@/theme/tokens'

const ROWS = 4

export function OrderListSkeleton() {
  const pulse = useRef(new Animated.Value(0.35)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.85,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [pulse])

  return (
    <View style={styles.wrap} accessibilityLabel="Загрузка списка">
      {Array.from({ length: ROWS }).map((_, i) => (
        <Animated.View key={i} style={[styles.card, { opacity: pulse }]}>
          <View style={styles.lineShort} />
          <View style={styles.lineLong} />
          <View style={styles.lineMid} />
        </Animated.View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.sm,
    paddingBottom: theme.space.lg,
    gap: theme.space.md,
  },
  card: {
    padding: theme.space.lg,
    backgroundColor: theme.color.bgElevated,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border,
    gap: theme.space.sm,
  },
  lineShort: {
    height: 14,
    width: '40%',
    borderRadius: 6,
    backgroundColor: theme.color.borderStrong,
  },
  lineLong: {
    height: 18,
    width: '100%',
    borderRadius: 6,
    backgroundColor: theme.color.border,
  },
  lineMid: {
    height: 12,
    width: '55%',
    borderRadius: 6,
    backgroundColor: theme.color.border,
  },
})
