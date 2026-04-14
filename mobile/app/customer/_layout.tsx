import { Stack } from 'expo-router'
import { theme } from '@/theme/tokens'

export default function CustomerLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Заказ' }} />
      <Stack.Screen name="orders" options={{ title: 'Мои заказы' }} />
      <Stack.Screen name="profile" options={{ title: 'Профиль' }} />
      <Stack.Screen name="new" options={{ title: 'Проверка и отправка' }} />
      <Stack.Screen name="order/[id]" options={{ title: 'Заказ' }} />
    </Stack>
  )
}
