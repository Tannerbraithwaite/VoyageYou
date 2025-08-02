import { Stack } from 'expo-router';
import GlobalErrorBoundary from './_error';

export default function RootLayout() {
  return (
    <GlobalErrorBoundary>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0a0a0a' },
        }}
      >
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GlobalErrorBoundary>
  );
}
