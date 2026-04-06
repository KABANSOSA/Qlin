import { Stack } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/lib/auth-context'
import { PushGate } from '@/components/push-gate'

const queryClient = new QueryClient()

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PushGate />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" options={{ headerShown: true, title: 'Вход' }} />
          <Stack.Screen name="customer" />
          <Stack.Screen name="cleaner" />
          <Stack.Screen name="map-preview" options={{ headerShown: true, title: 'Карта' }} />
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
  )
}
