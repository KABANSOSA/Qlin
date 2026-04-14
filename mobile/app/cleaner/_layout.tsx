import { Stack } from 'expo-router'
import { theme } from '@/theme/tokens'

export default function CleanerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.color.bgElevated },
        headerShadowVisible: false,
        headerTintColor: theme.color.primaryDark,
        headerTitleStyle: {
          fontFamily: theme.fontFamily.semiBold,
          fontSize: 17,
          color: theme.color.text,
        },
        headerBackTitle: 'Назад',
        contentStyle: { backgroundColor: theme.color.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Работа' }} />
      <Stack.Screen name="profile" options={{ title: 'Профиль' }} />
      <Stack.Screen name="order/[id]" options={{ title: 'Заказ' }} />
    </Stack>
  )
}
