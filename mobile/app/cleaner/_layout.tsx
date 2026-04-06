import { Stack } from 'expo-router'

export default function CleanerLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'Мои заказы' }} />
    </Stack>
  )
}
