import { Stack } from 'expo-router';
import GlobalErrorBoundary from './_error';
import { View } from 'react-native';
import GradientBackground from '@/components/ui/GradientBackground';
import { TripSettingsProvider } from '@/components/TripSettingsContext';

export default function RootLayout() {
  return (
    <TripSettingsProvider>
      <GlobalErrorBoundary>
        <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
          <GradientBackground />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: 'transparent' },
            }}
          >
            <Stack.Screen name="auth" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </View>
      </GlobalErrorBoundary>
    </TripSettingsProvider>
  );
}
