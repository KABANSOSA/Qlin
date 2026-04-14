import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as SplashScreen from 'expo-splash-screen'
import * as WebBrowser from 'expo-web-browser'
import { View, ActivityIndicator } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '@/lib/auth-context'
import { PushGate } from '@/components/push-gate'
import { useAppFonts } from '@/theme/fonts'
import { theme } from '@/theme/tokens'

WebBrowser.maybeCompleteAuthSession()

SplashScreen.preventAutoHideAsync().catch(() => {})

const queryClient = new QueryClient()

export default function RootLayout() {
  const fontsLoaded = useAppFonts()

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.color.bg,
        }}
      >
        <ActivityIndicator size="large" color={theme.color.primary} />
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PushGate />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.color.bg },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="customer" />
            <Stack.Screen name="cleaner" />
            <Stack.Screen
              name="map-preview"
              options={{
                headerShown: true,
                title: 'Карта',
                headerStyle: { backgroundColor: theme.color.bgElevated },
                headerShadowVisible: false,
                headerTintColor: theme.color.primaryDark,
                headerTitleStyle: {
                  fontFamily: theme.fontFamily.semiBold,
                  fontSize: 17,
                  color: theme.color.text,
                },
              }}
            />
          </Stack>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
