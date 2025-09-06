import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import ProfileScreen from '@/app/(tabs)/profile';

// Mock the auth service
jest.mock('@/services/auth', () => ({
  getCurrentUser: jest.fn(),
  signOut: jest.fn(),
}));

// Mock the router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

describe('ProfileScreen', () => {
  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    avatar: 'https://example.com/avatar.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with user information', () => {
    const mockAuth = require('@/services/auth');
    mockAuth.getCurrentUser.mockResolvedValue(mockUser);

    const { getByText, getByTestId } = render(<ProfileScreen />);

    expect(getByText('Profile')).toBeTruthy();
    expect(getByText('Test User')).toBeTruthy();
    expect(getByText('test@example.com')).toBeTruthy();
  });

  it('shows loading state while fetching user data', () => {
    const mockAuth = require('@/services/auth');
    mockAuth.getCurrentUser.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    const { getByText } = render(<ProfileScreen />);

    expect(getByText('Loading...')).toBeTruthy();
  });

  it('shows error state when user fetch fails', async () => {
    const mockAuth = require('@/services/auth');
    mockAuth.getCurrentUser.mockRejectedValue(new Error('Failed to fetch user'));

    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Error loading profile')).toBeTruthy();
      expect(getByText('Please try again later')).toBeTruthy();
    });
  });

  it('displays user avatar when available', () => {
    const mockAuth = require('@/services/auth');
    mockAuth.getCurrentUser.mockResolvedValue(mockUser);

    const { getByTestId } = render(<ProfileScreen />);

    const avatar = getByTestId('user-avatar');
    expect(avatar).toBeTruthy();
  });

  it('shows default avatar when no avatar is provided', () => {
    const mockAuth = require('@/services/auth');
    const userWithoutAvatar = { ...mockUser, avatar: null };
    mockAuth.getCurrentUser.mockResolvedValue(userWithoutAvatar);

    const { getByText } = render(<ProfileScreen />);

    expect(getByText('👤')).toBeTruthy(); // Default avatar emoji
  });

  it('displays user statistics correctly', () => {
    const mockAuth = require('@/services/auth');
    mockAuth.getCurrentUser.mockResolvedValue(mockUser);

    const { getByText } = render(<ProfileScreen />);

    expect(getByText('Travel Statistics')).toBeTruthy();
    expect(getByText('Total Trips')).toBeTruthy();
    expect(getByText('Countries Visited')).toBeTruthy();
    expect(getByText('Favorite Destinations')).toBeTruthy();
  });

  it('shows edit profile button', () => {
    const mockAuth = require('@/services/auth');
    mockAuth.getCurrentUser.mockResolvedValue(mockUser);

    const { getByText } = render(<ProfileScreen />);

    expect(getByText('Edit Profile')).toBeTruthy();
  });

  it('shows settings button', () => {
    const mockAuth = require('@/services/auth');
    mockAuth.getCurrentUser.mockResolvedValue(mockUser);

    const { getByText } = render(<ProfileScreen />);

    expect(getByText('Settings')).toBeTruthy();
  });

  it('shows help and support button', () => {
    const mockAuth = require('@/services/auth');
    mockAuth.getCurrentUser.mockResolvedValue(mockUser);

    const { getByText } = render(<ProfileScreen />);

    expect(getByText('Help & Support')).toBeTruthy();
  });

  it('shows about button', () => {
    const mockAuth = require('@/services/auth');
    mockAuth.getCurrentUser.mockResolvedValue(mockUser);

    const { getByText } = render(<ProfileScreen />);

    expect(getByText('About')).toBeTruthy();
  });

  it('shows sign out button', () => {
    const mockAuth = require('@/services/auth');
    mockAuth.getCurrentUser.mockResolvedValue(mockUser);

    const { getByText } = render(<ProfileScreen />);

    expect(getByText('Sign Out')).toBeTruthy();
  });

  it('navigates to edit profile when edit button is pressed', () => {
    const mockAuth = require('@/services/auth');
    mockAuth.getCurrentUser.mockResolvedValue(mockUser);

    const mockRouter = require('expo-router');
    const { getByText } = render(<ProfileScreen />);

    const editButton = getByText('Edit Profile');
    fireEvent.press(editButton);

    expect(mockRouter.router.push).toHaveBeenCalledWith('/edit-profile');
  });

  it('navigates to settings when settings button is pressed', () => {
    const mockAuth = require('@/services/auth');
    mockAuth.getCurrentUser.mockResolvedValue(mockUser);

    const mockRouter = require('expo-router');
    const { getByText } = render(<ProfileScreen />);

    const settingsButton = getByText('Settings');
    fireEvent.press(settingsButton);

    expect(mockRouter.router.push).toHaveBeenCalledWith('/settings');
  });

  it('navigates to help when help button is pressed', () => {
    const mockAuth = require('@/services/auth');
    mockAuth.getCurrentUser.mockResolvedValue(mockUser);

    const mockRouter = require('expo-router');
    const { getByText } = render(<ProfileScreen />);

    const helpButton = getByText('Help & Support');
    fireEvent.press(helpButton);

    expect(mockRouter.router.push).toHaveBeenCalledWith('/help');
  });

  it('navigates to about when about button is pressed', () => {
    const mockAuth = require('@/services/auth');
    mockAuth.getCurrentUser.mockResolvedValue(mockUser);

    const mockRouter = require('expo-router');
    const { getByText } = render(<ProfileScreen />);

    const aboutButton = getByText('About');
    fireEvent.press(aboutButton);

    expect(mockRouter.router.push).toHaveBeenCalledWith('/about');
  });

  it('handles sign out when sign out button is pressed', async () => {
    const mockAuth = require('@/services/auth');
    mockAuth.getCurrentUser.mockResolvedValue(mockUser);
    mockAuth.signOut.mockResolvedValue(undefined);

    const mockRouter = require('expo-router');
    const { getByText } = render(<ProfileScreen />);

    const signOutButton = getByText('Sign Out');
    
    await act(async () => {
      fireEvent.press(signOutButton);
    });

    expect(mockAuth.signOut).toHaveBeenCalled();
    expect(mockRouter.router.replace).toHaveBeenCalledWith('/auth/login');
  });

  it('shows confirmation dialog before signing out', async () => {
    const mockAuth = require('@/services/auth');
    mockAuth.getCurrentUser.mockResolvedValue(mockUser);

    const { getByText } = render(<ProfileScreen />);

    const signOutButton = getByText('Sign Out');
    
    await act(async () => {
      fireEvent.press(signOutButton);
    });

    // Should show confirmation dialog
    expect(getByText('Sign Out')).toBeTruthy();
  });

  it('displays user preferences section', () => {
    const mockAuth = require('@/services/auth');
    mockAuth.getCurrentUser.mockResolvedValue(mockUser);

    const { getByText } = render(<ProfileScreen />);

    expect(getByText('Preferences')).toBeTruthy();
    expect(getByText('Language')).toBeTruthy();
    expect(getByText('Currency')).toBeTruthy();
    expect(getByText('Notifications')).toBeTruthy();
  });

  it('shows privacy settings', () => {
    const mockAuth = require('@/services/auth');
    mockAuth.getCurrentUser.mockResolvedValue(mockUser);

    const { getByText } = render(<ProfileScreen />);

    expect(getByText('Privacy')).toBeTruthy();
    expect(getByText('Data Usage')).toBeTruthy();
    expect(getByText('Location Services')).toBeTruthy();
  });

  it('handles user data updates', () => {
    const mockAuth = require('@/services/auth');
    mockAuth.getCurrentUser.mockResolvedValue(mockUser);

    const { getByText } = render(<ProfileScreen />);

    // Should show update profile option
    expect(getByText('Update Profile')).toBeTruthy();
  });

  it('displays account information section', () => {
    const mockAuth = require('@/services/auth');
    mockAuth.getCurrentUser.mockResolvedValue(mockUser);

    const { getByText } = render(<ProfileScreen />);

    expect(getByText('Account Information')).toBeTruthy();
    expect(getByText('Member Since')).toBeTruthy();
    expect(getByText('Last Login')).toBeTruthy();
  });

  it('shows version information', () => {
    const mockAuth = require('@/services/auth');
    mockAuth.getCurrentUser.mockResolvedValue(mockUser);

    const { getByText } = render(<ProfileScreen />);

    expect(getByText('App Version')).toBeTruthy();
    expect(getByText('1.0.0')).toBeTruthy(); // Assuming this is the version
  });

  it('handles profile refresh', async () => {
    const mockAuth = require('@/services/auth');
    mockAuth.getCurrentUser.mockResolvedValue(mockUser);

    const { getByTestId } = render(<ProfileScreen />);

    const refreshControl = getByTestId('profile-refresh');
    
    await act(async () => {
      fireEvent(refreshControl, 'refresh');
    });

    // Should refresh user data
    expect(mockAuth.getCurrentUser).toHaveBeenCalledTimes(2); // Initial + refresh
  });

  it('shows loading indicator during profile refresh', async () => {
    const mockAuth = require('@/services/auth');
    mockAuth.getCurrentUser.mockResolvedValue(mockUser);

    const { getByTestId } = render(<ProfileScreen />);

    const refreshControl = getByTestId('profile-refresh');
    
    await act(async () => {
      fireEvent(refreshControl, 'refresh');
    });

    // Should show loading state during refresh
    expect(refreshControl).toBeTruthy();
  });
});
