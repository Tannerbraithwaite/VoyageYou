import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: number;
  name: string;
  email: string;
  travel_style?: string;
  budget_range?: string;
  additional_info?: string;
}

export interface LoginResponse {
  user: User;
  message: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(email: string, password: string, rememberMe: boolean = false): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password
        }),
        credentials: 'include', // Include cookies
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = errorData.detail || 'Login failed';
        
        // Provide more user-friendly error messages
        if (response.status === 401) {
          if (errorMessage.includes('Invalid credentials')) {
            errorMessage = 'Invalid credentials';
          } else if (errorMessage.includes('not found')) {
            errorMessage = 'User not found';
          }
        }
        
        throw new Error(errorMessage);
      }

      const data: LoginResponse = await response.json();
      
      // Store tokens
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.currentUser = data.user;

      // Store in AsyncStorage if remember me is checked
      if (rememberMe) {
        await this.storeTokens(data.access_token, data.refresh_token);
        await this.storeUser(data.user);
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async signup(userData: {
    name: string;
    email: string;
    password: string;
    travel_style?: string;
    budget_range?: string;
    additional_info?: string;
  }, rememberMe: boolean = false): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include', // Include cookies
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Signup failed');
      }

      const data: LoginResponse = await response.json();
      
      // Store tokens
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.currentUser = data.user;

      // Store in AsyncStorage if remember me is checked
      if (rememberMe) {
        await this.storeTokens(data.access_token, data.refresh_token);
        await this.storeUser(data.user);
      }

      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // Call logout endpoint to clear server-side cookies
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      // Clear local storage
      await this.clearStoredData();
      
      // Clear memory
      this.currentUser = null;
      this.accessToken = null;
      this.refreshToken = null;
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local data even if server call fails
      await this.clearStoredData();
      this.currentUser = null;
      this.accessToken = null;
      this.refreshToken = null;
    }
  }

  // ---------------- Password Reset -----------------

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Unable to process request');
      }
      return await response.json();
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Unable to reset password');
      }
      return await response.json();
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include', // Use cookies instead of Authorization header
      });

      if (response.ok) {
        const user = await response.json();
        this.currentUser = user;
        return user;
      } else {
        // Try to refresh token
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          return await this.getCurrentUser();
        }
        return null;
      }
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async refreshAccessToken(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Use cookies instead of body
      });

      if (response.ok) {
        const data: TokenResponse = await response.json();
        this.accessToken = data.access_token;
        await this.storeTokens(data.access_token, this.refreshToken || '');
        return true;
      } else {
        // Refresh token is invalid, clear stored data
        await this.clearStoredData();
        this.currentUser = null;
        this.accessToken = null;
        this.refreshToken = null;
        return false;
      }
    } catch (error) {
      console.error('Refresh token error:', error);
      return false;
    }
  }

  async initializeAuth(): Promise<User | null> {
    try {
      // Try to load stored tokens
      const storedAccessToken = await AsyncStorage.getItem('access_token');
      const storedRefreshToken = await AsyncStorage.getItem('refresh_token');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedAccessToken && storedRefreshToken) {
        this.accessToken = storedAccessToken;
        this.refreshToken = storedRefreshToken;
        
        if (storedUser) {
          this.currentUser = JSON.parse(storedUser);
        }

        // Verify token is still valid
        const user = await this.getCurrentUser();
        return user;
      }
    } catch (error) {
      console.error('Initialize auth error:', error);
      await this.clearStoredData();
    }

    return null;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null && this.accessToken !== null;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getCurrentUserSync(): User | null {
    return this.currentUser;
  }

  private async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await AsyncStorage.setItem('access_token', accessToken);
      await AsyncStorage.setItem('refresh_token', refreshToken);
    } catch (error) {
      console.error('Store tokens error:', error);
    }
  }

  private async storeUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Store user error:', error);
    }
  }

  private async clearStoredData(): Promise<void> {
    try {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Clear stored data error:', error);
    }
  }
}

export default AuthService.getInstance(); 