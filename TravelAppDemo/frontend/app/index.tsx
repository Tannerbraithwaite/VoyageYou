import { useEffect } from 'react';
import { router } from 'expo-router';

export default function Index() {
  useEffect(() => {
    // Redirect to auth login
    router.replace('/auth/login');
  }, []);

  return null;
} 