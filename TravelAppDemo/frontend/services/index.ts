// Service layer for API calls and external integrations

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

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
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error registering:', error);
      throw error;
    }
  }
} 