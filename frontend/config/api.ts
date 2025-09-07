// API Configuration for different environments
import { Platform } from 'react-native';

// Railway backend URL (your deployed backend)
const RAILWAY_BACKEND_URL = 'https://voyageyou-production.up.railway.app';

// Determine the base URL based on platform and environment
export const getBaseURL = () => {
  // For web development, use Railway backend (same as mobile)
  if (Platform.OS === 'web') {
    console.log('🌐 Using Railway backend for web platform:', RAILWAY_BACKEND_URL);
    return RAILWAY_BACKEND_URL;
  }
  
  // For mobile development, use Railway backend
  console.log('📱 Using Railway backend for mobile platform:', RAILWAY_BACKEND_URL);
  return RAILWAY_BACKEND_URL;
};

// Current API base URL
export const API_BASE_URL = getBaseURL();

// Export for easy access
export default API_BASE_URL;
