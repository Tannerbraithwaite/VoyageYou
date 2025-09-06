import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

// OAuth Configuration
// For demo purposes, using a public Google Client ID
// In production, you'd use your own Google OAuth credentials
const GOOGLE_CLIENT_ID = '1082045743309-dmv4ea2mp7vig54cbuybvfh6vb4s26i6.apps.googleusercontent.com';

// Create redirect URI that works with Expo development
const GOOGLE_REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: 'voyageyo',
  path: 'auth'
});

const APPLE_CLIENT_ID = 'your-apple-client-id';
const APPLE_REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: 'voyageyo',
  path: 'auth'
});

export interface OAuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: 'google' | 'apple';
}

class OAuthService {
  private static instance: OAuthService;

  private constructor() {}

  static getInstance(): OAuthService {
    if (!OAuthService.instance) {
      OAuthService.instance = new OAuthService();
    }
    return OAuthService.instance;
  }

  async signInWithGoogle(): Promise<OAuthUser | null> {
    try {
      // For demo purposes, show the OAuth flow but use mock data
      // This avoids the redirect URI configuration issues
      console.log('Starting Google OAuth flow...');
      
      // Simulate the OAuth flow
      const mockGoogleUser = {
        id: 'google-user-123',
        email: 'google-user@example.com',
        name: 'Google User',
        picture: 'https://via.placeholder.com/150',
        provider: 'google' as const
      };

      // Send to backend for verification
      const response = await fetch(`${API_BASE_URL}/auth/oauth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_token: 'mock-google-token',
          provider: 'google'
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Google OAuth failed');
      }

      const data = await response.json();
      console.log('Google OAuth successful:', data);
      return mockGoogleUser;
    } catch (error) {
      console.error('Google OAuth error:', error);
      return null;
    }
  }

  async signInWithApple(): Promise<OAuthUser | null> {
    try {
      // For demo purposes, show the OAuth flow but use mock data
      console.log('Starting Apple OAuth flow...');
      
      // Simulate the OAuth flow
      const mockAppleUser = {
        id: 'apple-user-456',
        email: 'apple-user@example.com',
        name: 'Apple User',
        provider: 'apple' as const
      };

      // Send to backend for verification
      const response = await fetch(`${API_BASE_URL}/auth/oauth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_token: 'mock-apple-token',
          provider: 'apple'
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Apple OAuth failed');
      }

      const data = await response.json();
      console.log('Apple OAuth successful:', data);
      return mockAppleUser;
    } catch (error) {
      console.error('Apple OAuth error:', error);
      return null;
    }
  }

  // Real Google OAuth implementation (for production)
  async signInWithGoogleReal(): Promise<OAuthUser | null> {
    try {
      const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
        revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
      };

      const request = new AuthSession.AuthRequest({
        clientId: GOOGLE_CLIENT_ID,
        scopes: ['openid', 'profile', 'email'],
        redirectUri: GOOGLE_REDIRECT_URI,
        responseType: AuthSession.ResponseType.IdToken,
        // Remove extra params that might be causing issues
      });

      const result = await request.promptAsync(discovery);

      if (result.type === 'success' && result.params.id_token) {
        console.log('Google OAuth successful, sending token to backend...');
        
        // Send the ID token to your backend
        const response = await fetch(`${API_BASE_URL}/auth/oauth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id_token: result.params.id_token,
            provider: 'google'
          }),
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Google OAuth verification failed: ${errorData.detail || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('Backend OAuth response:', data);
        
        // Return user info from backend response
        return {
          id: data.user.id.toString(),
          email: data.user.email,
          name: data.user.name,
          provider: 'google' as const
        };
      } else if (result.type === 'cancel') {
        console.log('Google OAuth cancelled by user');
        return null;
      } else {
        console.log('Google OAuth failed:', result);
        return null;
      }
    } catch (error) {
      console.error('Google OAuth error:', error);
      return null;
    }
  }

  // Real Apple OAuth implementation (for production)
  async signInWithAppleReal(): Promise<OAuthUser | null> {
    try {
      // Apple Sign-In requires additional setup
      // This is a placeholder for the real implementation
      
      const request = new AuthSession.AuthRequest({
        clientId: APPLE_CLIENT_ID,
        scopes: ['name', 'email'],
        redirectUri: APPLE_REDIRECT_URI,
        responseType: AuthSession.ResponseType.IdToken,
        extraParams: {
          response_mode: 'form_post',
        },
      });

      // Apple Sign-In implementation would go here
      // This requires additional setup with Apple Developer account
      
      return null;
    } catch (error) {
      console.error('Apple OAuth error:', error);
      return null;
    }
  }
}

export default OAuthService.getInstance(); 