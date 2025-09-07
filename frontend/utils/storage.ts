// Safe storage utilities for web and mobile platforms
import { Platform } from 'react-native';

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
  getItem: (key: string): string | null => {
    if (hasLocalStorage) {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.warn('localStorage.getItem failed:', error);
        return null;
      }
    }
    return null;
  },

  setItem: (key: string, value: string): void => {
    if (hasLocalStorage) {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.warn('localStorage.setItem failed:', error);
      }
    }
  },

  removeItem: (key: string): void => {
    if (hasLocalStorage) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('localStorage.removeItem failed:', error);
      }
    }
  }
};
