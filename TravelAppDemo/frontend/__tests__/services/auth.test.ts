import { loginUser, registerUser, logoutUser } from '@/services/auth';

// Mock fetch
global.fetch = jest.fn();

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loginUser', () => {
    it('successfully logs in user', async () => {
      const mockResponse = {
        access_token: 'mock_token',
        token_type: 'bearer',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await loginUser('testuser', 'password123');

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123',
        }),
      });

      expect(result).toEqual(mockResponse);
    });

    it('handles login error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Invalid credentials' }),
      });

      await expect(loginUser('testuser', 'wrongpassword')).rejects.toThrow('Invalid credentials');
    });

    it('handles network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(loginUser('testuser', 'password123')).rejects.toThrow('Network error');
    });
  });

  describe('registerUser', () => {
    it('successfully registers user', async () => {
      const mockResponse = {
        access_token: 'mock_token',
        token_type: 'bearer',
        user: {
          id: 1,
          username: 'newuser',
          email: 'new@example.com',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await registerUser('newuser', 'new@example.com', 'password123');

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123',
        }),
      });

      expect(result).toEqual(mockResponse);
    });

    it('handles registration error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Username already exists' }),
      });

      await expect(registerUser('existinguser', 'test@example.com', 'password123')).rejects.toThrow('Username already exists');
    });
  });

  describe('logoutUser', () => {
    it('successfully logs out user', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Logged out successfully' }),
      });

      await logoutUser();

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('handles logout error gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      // Should not throw error for logout
      await expect(logoutUser()).resolves.toBeUndefined();
    });
  });
}); 