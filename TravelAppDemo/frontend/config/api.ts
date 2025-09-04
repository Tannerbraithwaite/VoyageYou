// API Configuration for different environments
import { Platform } from 'react-native';

// Railway backend URL (your deployed backend)
const RAILWAY_BACKEND_URL = 'https://travel-app-demo-production.up.railway.app';

// Determine the base URL based on platform and environment
export const getBaseURL = () => {
  // For web development, use localhost
  if (Platform.OS === 'web') {
    return 'http://localhost:8000';
  }
  
  // For mobile development, use Railway backend
  return RAILWAY_BACKEND_URL;
};

// Current API base URL
export const API_BASE_URL = getBaseURL();

// Export for easy access
export default API_BASE_URL;
