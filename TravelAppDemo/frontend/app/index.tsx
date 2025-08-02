import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  useEffect(() => {
    // Add a small delay to ensure navigation is ready
    const timer = setTimeout(() => {
      try {
        router.replace('/auth/login');
      } catch (error) {
        console.error('Navigation error:', error);
        // Fallback navigation
        router.push('/auth/login');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' }}>
      <ActivityIndicator size="large" color="#6366f1" />
    </View>
  );
} 