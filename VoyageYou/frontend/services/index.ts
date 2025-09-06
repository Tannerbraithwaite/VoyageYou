// Service layer for API calls and external integrations
import { API_BASE_URL } from '../config/api';

// Export auth service
export { default as authService } from './auth';
export { default as oauthService } from './oauth';

/**
 * API service for travel-related operations
 */
export class TravelService {
  static async getDestinations(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/destinations`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching destinations:', error);
      return [];
    }
  }

  static async getDestinationById(id: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/destinations/${id}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching destination:', error);
      return null;
    }
  }

  static async searchDestinations(query: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/destinations/search?q=${encodeURIComponent(query)}`);
      return await response.json();
    } catch (error) {
      console.error('Error searching destinations:', error);
      return [];
    }
  }
}

/**
 * Chat service for AI interactions
 */
export class ChatService {
  static async sendMessage(message: string): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error sending message:', error);
      return 'Sorry, I encountered an error. Please try again.';
    }
  }
}

/**
 * User service for authentication and user data
 */
export class UserService {
  static async login(email: string, password: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  static async register(email: string, password: string, name: string): Promise<any> {
    console.log('🚀 Starting register function');
    console.log('📧 Email:', email);
    console.log('🔑 Password length:', password.length);
    console.log('👤 Name:', name);
    
    try {
      const url = `${API_BASE_URL}/auth/signup`;
      console.log('🔍 Register URL:', url);
      console.log('🔍 API_BASE_URL:', API_BASE_URL);
      
      const requestBody = JSON.stringify({ email, password, name });
      console.log('📦 Request body:', requestBody);
      
      console.log('🌐 Making fetch request...');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });
      
      console.log('✅ Fetch completed');
      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));
      
      const result = await response.json();
      console.log('🔍 Response data:', result);
      return result;
    } catch (error) {
      console.error('❌ Error registering:', error);
      console.error('❌ Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      throw error;
    }
  }
} 