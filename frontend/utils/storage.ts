// Safe storage utilities for web and mobile platforms
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Check if we're running on web and storage APIs are available
const isWeb = Platform.OS === 'web';
const hasSessionStorage = isWeb && typeof window !== 'undefined' && window.sessionStorage;
const hasLocalStorage = isWeb && typeof window !== 'undefined' && window.localStorage;

export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    if (hasSessionStorage) {
      try {
        return sessionStorage.getItem(key);
      } catch (error) {
        console.warn('sessionStorage.getItem failed:', error);
        return null;
      }
    }
    return null;
  },

  setItem: (key: string, value: string): void => {
    if (hasSessionStorage) {
      try {
        sessionStorage.setItem(key, value);
      } catch (error) {
        console.warn('sessionStorage.setItem failed:', error);
      }
    }
  },

  removeItem: (key: string): void => {
    if (hasSessionStorage) {
      try {
        sessionStorage.removeItem(key);
      } catch (error) {
        console.warn('sessionStorage.removeItem failed:', error);
      }
    }
  }
};

export const safeLocalStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (hasLocalStorage) {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.warn('localStorage.getItem failed:', error);
        return null;
      }
    } else {
      // Use AsyncStorage for mobile
      try {
        return await AsyncStorage.getItem(key);
      } catch (error) {
        console.warn('AsyncStorage.getItem failed:', error);
        return null;
      }
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (hasLocalStorage) {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.warn('localStorage.setItem failed:', error);
      }
    } else {
      // Use AsyncStorage for mobile
      try {
        await AsyncStorage.setItem(key, value);
      } catch (error) {
        console.warn('AsyncStorage.setItem failed:', error);
      }
    }
  },

  removeItem: async (key: string): Promise<void> => {
    if (hasLocalStorage) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('localStorage.removeItem failed:', error);
      }
    } else {
      // Use AsyncStorage for mobile
      try {
        await AsyncStorage.removeItem(key);
      } catch (error) {
        console.warn('AsyncStorage.removeItem failed:', error);
      }
    }
  }
};
