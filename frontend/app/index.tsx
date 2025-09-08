import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import authService from '@/services/auth';

export default function Index() {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 Starting authentication check...');
        
        // Try to initialize authentication from stored tokens
        const user = await authService.initializeAuth();
        console.log('🔍 User from initializeAuth:', user ? 'Found' : 'Not found');
        
        const isAuth = authService.isAuthenticated();
        console.log('🔍 Is authenticated:', isAuth);
        
        if (user && isAuth) {
          // User is authenticated, go to main app
          console.log('✅ User authenticated, navigating to main app');
          router.replace('/(tabs)');
        } else {
          // User is not authenticated, go to login
          console.log('❌ User not authenticated, navigating to login');
          router.replace('/auth/login');
        }
      } catch (error) {
        console.error('❌ Auth check error:', error);
        // On error, go to login
        router.replace('/auth/login');
      }
    };

    // Add a small delay to ensure navigation is ready
    const timer = setTimeout(checkAuth, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' }}>
      <ActivityIndicator size="large" color="#6366f1" />
    </View>
  );
} 