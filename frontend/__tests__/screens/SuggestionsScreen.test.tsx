import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import SuggestionsScreen from '@/app/(tabs)/suggestions';

// Mock the auth service
jest.mock('@/services/auth', () => ({
  getCurrentUser: jest.fn(),
}));

// Mock the TripSettingsContext
jest.mock('@/components/TripSettingsContext', () => ({
  useTripSettings: () => ({
    settings: { startDate: null, days: 3 },
    update: jest.fn(),
  }),
}));

// Mock the DatePicker component
jest.mock('@/components/DatePicker', () => {
  return function MockDatePicker({ tripDates, onDatesChange }: any) {
    return (
      <div>
        <button onPress={() => onDatesChange({ ...tripDates, startDate: new Date('2024-07-15') })}>
          Set Start Date
        </button>
        <button onPress={() => onDatesChange({ ...tripDates, endDate: new Date('2024-07-18') })}>
          Set End Date
        </button>
      </div>
    );
  };
});

describe('SuggestionsScreen', () => {
  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset localStorage mock
    (global.localStorage.getItem as jest.Mock).mockReturnValue(null);
    (global.localStorage.setItem as jest.Mock).mockReturnValue(undefined);
    // Reset sessionStorage mock
    (global.sessionStorage.getItem as jest.Mock).mockReturnValue(null);
    (global.sessionStorage.setItem as jest.Mock).mockReturnValue(undefined);
  });

  it('renders correctly with initial state', () => {
    const { getByText } = render(<SuggestionsScreen />);

    expect(getByText('Your Next Adventure')).toBeTruthy();
    expect(getByText('AI-powered recommendations based on your preferences')).toBeTruthy();
    expect(getByText('Your Travel Profile')).toBeTruthy();
    expect(getByText('Get My Travel Profile')).toBeTruthy();
    expect(getByText('Personalized Recommendations')).toBeTruthy();
  });

  it('shows no profile message when profile not generated', () => {
    const { getByText } = render(<SuggestionsScreen />);

    expect(getByText(/Click the button below to generate your personalized travel profile/)).toBeTruthy();
  });

  it('shows no recommendations message when not generated', () => {
    const { getByText } = render(<SuggestionsScreen />);

    expect(getByText(/Generate your travel profile first to get personalized trip recommendations/)).toBeTruthy();
  });

  it('loads saved travel profile from localStorage', () => {
    const mockProfile = {
      insights: ['You love food experiences', 'Cultural activities are your favorite'],
      generatedAt: '2024-07-15T10:00:00.000Z',
    };

    (global.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockProfile));

    const { getByText } = render(<SuggestionsScreen />);

    expect(getByText('• You love food experiences')).toBeTruthy();
    expect(getByText('• Cultural activities are your favorite')).toBeTruthy();
    expect(getByText('🔄 Refresh Travel Profile')).toBeTruthy();
  });

  it('loads saved trip recommendations from localStorage', () => {
    const mockRecommendations = {
      recommendations: [
        {
          id: 1,
          destination: 'Paris, France',
          reason: 'Perfect for your interests',
          highlights: ['Eiffel Tower', 'Louvre Museum'],
          whyYoullLoveIt: 'You will love the culture',
          confidence: 90,
        },
      ],
      generatedAt: '2024-07-15T10:00:00.000Z',
    };

    (global.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockRecommendations));

    const { getByText } = render(<SuggestionsScreen />);

    expect(getByText('Paris, France')).toBeTruthy();
    expect(getByText('Perfect for your interests')).toBeTruthy();
    expect(getByText('🎯 Generate Trip Recommendations')).toBeTruthy();
  });

  it('generates travel profile when button is pressed', async () => {
    const mockAuth = require('@/services/auth');
    mockAuth.getCurrentUser.mockResolvedValue(mockUser);

    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        bot_response: '• You love food experiences\n• Cultural activities are your favorite',
      }),
    });

    const { getByText } = render(<SuggestionsScreen />);
    const generateButton = getByText('Get My Travel Profile');

    await act(async () => {
      fireEvent.press(generateButton);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/chat/travel-profile/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: expect.stringContaining('You are a travel expert analyzing a user'),
          user_id: 1,
        }),
      });
    });
  });

  it('generates trip recommendations when button is pressed', async () => {
    const mockAuth = require('@/services/auth');
    mockAuth.getCurrentUser.mockResolvedValue(mockUser);

    // First generate a profile
    const mockProfile = {
      insights: ['You love food experiences'],
      generatedAt: '2024-07-15T10:00:00.000Z',
    };
    (global.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockProfile));

    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        bot_response: JSON.stringify([
          {
            id: 1,
            destination: 'Paris, France',
            reason: 'Perfect for your interests',
            highlights: ['Eiffel Tower', 'Louvre Museum'],
            whyYoullLoveIt: 'You will love the culture',
            confidence: 90,
          },
        ]),
      }),
    });

    const { getByText } = render(<SuggestionsScreen />);
    const generateRecommendationsButton = getByText('🎯 Generate Trip Recommendations');

    await act(async () => {
      fireEvent.press(generateRecommendationsButton);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.objectContaining({
          message: expect.stringContaining('You are a creative and adventurous travel expert'),
          user_id: 1,
        }),
      });
    });
  });

  it('handles API errors gracefully', async () => {
    const mockAuth = require('@/services/auth');
    mockAuth.getCurrentUser.mockResolvedValue(mockUser);

    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { getByText } = render(<SuggestionsScreen />);
    const generateButton = getByText('Get My Travel Profile');

    await act(async () => {
      fireEvent.press(generateButton);
    });

    // Should show fallback insights after error
    await waitFor(() => {
      expect(getByText('• You love food experiences (rated 5/5 for food tours)')).toBeTruthy();
    });
  });

  it('plans a trip when plan button is pressed', async () => {
    const mockAuth = require('@/services/auth');
    mockAuth.getCurrentUser.mockResolvedValue(mockUser);

    const mockRecommendations = {
      recommendations: [
        {
          id: 1,
          destination: 'Paris, France',
          reason: 'Perfect for your interests',
          highlights: ['Eiffel Tower', 'Louvre Museum'],
          whyYoullLoveIt: 'You will love the culture',
          confidence: 90,
          duration: '3 days',
          estimatedCost: 2000,
        },
      ],
      generatedAt: '2024-07-15T10:00:00.000Z',
    };

    (global.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockRecommendations));

    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        destination: 'Paris, France',
        duration: '3 days',
        description: 'Amazing trip to Paris',
        flights: [],
        hotel: { name: 'Test Hotel', price: 200 },
        schedule: [],
        total_cost: 2000,
      }),
    });

    const { getByText } = render(<SuggestionsScreen />);
    const planButton = getByText('Plan This Trip');

    await act(async () => {
      fireEvent.press(planButton);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/chat/enhanced/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.objectContaining({
          message: expect.stringContaining('Paris, France'),
          user_id: 1,
        }),
      });
    });
  });

  it('shows planning modal while generating itinerary', async () => {
    const mockAuth = require('@/services/auth');
    mockAuth.getCurrentUser.mockResolvedValue(mockUser);

    const mockRecommendations = {
      recommendations: [
        {
          id: 1,
          destination: 'Paris, France',
          reason: 'Perfect for your interests',
          highlights: ['Eiffel Tower'],
          whyYoullLoveIt: 'You will love the culture',
          confidence: 90,
          duration: '3 days',
          estimatedCost: 2000,
        },
      ],
      generatedAt: '2024-07-15T10:00:00.000Z',
    };

    (global.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockRecommendations));

    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    const { getByText } = render(<SuggestionsScreen />);
    const planButton = getByText('Plan This Trip');

    await act(async () => {
      fireEvent.press(planButton);
    });

    expect(getByText('Planning Your Trip')).toBeTruthy();
    expect(getByText(/Creating a detailed itinerary for Paris, France/)).toBeTruthy();
  });

  it('displays recommendation details correctly', () => {
    const mockRecommendations = {
      recommendations: [
        {
          id: 1,
          destination: 'Paris, France',
          reason: 'Perfect for your interests',
          highlights: ['Eiffel Tower', 'Louvre Museum', 'Seine River'],
          whyYoullLoveIt: 'You will love the culture and food',
          confidence: 90,
          duration: '3 days',
          estimatedCost: 2000,
        },
      ],
      generatedAt: '2024-07-15T10:00:00.000Z',
    };

    (global.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockRecommendations));

    const { getByText } = render(<SuggestionsScreen />);

    expect(getByText('Paris, France')).toBeTruthy();
    expect(getByText('Perfect for your interests')).toBeTruthy();
    expect(getByText('Why You\'ll Love It')).toBeTruthy();
    expect(getByText('You will love the culture and food')).toBeTruthy();
    expect(getByText('Top Highlights')).toBeTruthy();
    expect(getByText('• Eiffel Tower')).toBeTruthy();
    expect(getByText('• Louvre Museum')).toBeTruthy();
    expect(getByText('• Seine River')).toBeTruthy();
    expect(getByText('90%')).toBeTruthy();
  });
});
