import { Redirect } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { useAuth } from '@/lib/auth-context'
import { theme } from '@/theme/tokens'

export default function Index() {
  const { user, loading } = useAuth()

  if (loading) {
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

  if (!user) {
    return <Redirect href="/login" />
  }

  if (user.role === 'cleaner') {
    return <Redirect href="/cleaner" />
  }

  return <Redirect href="/customer" />
}
