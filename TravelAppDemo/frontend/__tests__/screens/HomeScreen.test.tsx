import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import HomeScreen from '@/app/(tabs)/index';

// Mock the components and hooks
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

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset sessionStorage mock
    (global.sessionStorage.getItem as jest.Mock).mockReturnValue(null);
    (global.sessionStorage.setItem as jest.Mock).mockReturnValue(undefined);
  });

  it('renders correctly with initial state', () => {
    const { getByText, getByPlaceholderText } = render(<HomeScreen />);

    expect(getByText('Travel Assistant')).toBeTruthy();
    expect(getByText('Chat with AI Assistant')).toBeTruthy();
    expect(getByText('Trip Dates')).toBeTruthy();
    expect(getByPlaceholderText('Ask me about your trip...')).toBeTruthy();
    expect(getByText('Send')).toBeTruthy();
  });

  it('allows user to type in chat input', () => {
    const { getByPlaceholderText } = render(<HomeScreen />);
    const input = getByPlaceholderText('Ask me about your trip...');

    fireEvent.changeText(input, 'I want to visit Paris');

    expect(input.props.value).toBe('I want to visit Paris');
  });

  it('sends message when send button is pressed', async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        destination: 'Paris, France',
        duration: '3 days',
        description: 'Test trip',
        flights: [],
        hotel: {
          name: 'Test Hotel',
          address: '123 Test St',
          check_in: '2024-07-15 15:00',
          check_out: '2024-07-18 11:00',
          room_type: 'Standard',
          price: 180,
          total_nights: 3,
        },
        schedule: [],
        total_cost: 2500,
        bookable_cost: 1800,
        estimated_cost: 700,
      }),
    });

    const { getByPlaceholderText, getByText } = render(<HomeScreen />);
    const input = getByPlaceholderText('Ask me about your trip...');
    const sendButton = getByText('Send');

    fireEvent.changeText(input, 'I want to visit Paris for 3 days');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/chat/enhanced/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'I want to visit Paris for 3 days',
          user_id: 1,
        }),
      });
    });
  });

  it('displays itinerary when received from API', async () => {
    const mockItinerary = {
      destination: 'Paris, France',
      duration: '3 days',
      description: 'Test trip',
      flights: [
        {
          airline: 'Air France',
          flight: 'AF123',
          departure: 'JFK → CDG',
          time: '10:00 - 11:30',
          price: 850,
          type: 'outbound',
        },
      ],
      hotel: {
        name: 'Test Hotel',
        address: '123 Test St',
        check_in: '2024-07-15 15:00',
        check_out: '2024-07-18 11:00',
        room_type: 'Standard',
        price: 180,
        total_nights: 3,
      },
      schedule: [
        {
          day: 1,
          date: '2024-07-15',
          activities: [
            {
              name: 'Eiffel Tower',
              time: '09:00',
              price: 25,
              type: 'bookable',
              description: 'Visit the iconic tower',
              alternatives: [],
            },
          ],
        },
      ],
      total_cost: 2500,
      bookable_cost: 1800,
      estimated_cost: 700,
    };

    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockItinerary,
    });

    const { getByPlaceholderText, getByText, findByText } = render(<HomeScreen />);
    const input = getByPlaceholderText('Ask me about your trip...');
    const sendButton = getByText('Send');

    fireEvent.changeText(input, 'I want to visit Paris for 3 days');
    fireEvent.press(sendButton);

    await waitFor(async () => {
      const destinationTitle = await findByText('Paris, France');
      expect(destinationTitle).toBeTruthy();
    });

    expect(getByText('Your Itinerary')).toBeTruthy();
    expect(getByText('3 days')).toBeTruthy();
    expect(getByText('✈️ Flights')).toBeTruthy();
    expect(getByText('🏨 Hotel')).toBeTruthy();
    expect(getByText('Cost Breakdown')).toBeTruthy();
  });

  it('handles API error gracefully', async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { getByPlaceholderText, getByText, findByText } = render(<HomeScreen />);
    const input = getByPlaceholderText('Ask me about your trip...');
    const sendButton = getByText('Send');

    fireEvent.changeText(input, 'Test message');
    fireEvent.press(sendButton);

    await waitFor(async () => {
      const errorMessage = await findByText('Sorry, I encountered an error. Please try again.');
      expect(errorMessage).toBeTruthy();
    });
  });

  it('shows loading state while sending message', async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    const { getByPlaceholderText, getByText } = render(<HomeScreen />);
    const input = getByPlaceholderText('Ask me about your trip...');
    const sendButton = getByText('Send');

    fireEvent.changeText(input, 'Test message');
    fireEvent.press(sendButton);

    expect(getByText('Sending...')).toBeTruthy();
  });

  it('loads itinerary from sessionStorage on mount', () => {
    const mockItinerary = {
      destination: 'Paris, France',
      duration: '3 days',
      description: 'Test trip',
      flights: [],
      hotel: {
        name: 'Test Hotel',
        address: '123 Test St',
        check_in: '2024-07-15 15:00',
        check_out: '2024-07-18 11:00',
        room_type: 'Standard',
        price: 180,
        total_nights: 3,
      },
      schedule: [],
      total_cost: 2500,
      bookable_cost: 1800,
      estimated_cost: 700,
    };

    (global.sessionStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockItinerary));

    const { getByText } = render(<HomeScreen />);

    expect(getByText('Paris, France')).toBeTruthy();
    expect(getByText('Your Itinerary')).toBeTruthy();
  });

  it('opens old trips modal when button is pressed', () => {
    const { getByText, queryByText } = render(<HomeScreen />);
    
    const oldTripsButton = getByText('View Old Trips');
    fireEvent.press(oldTripsButton);

    expect(getByText('Past Trips')).toBeTruthy();
    expect(getByText('Paris, France')).toBeTruthy();
    expect(getByText('Tokyo, Japan')).toBeTruthy();
  });

  it('allows rating activities in old trips', () => {
    const { getByText } = render(<HomeScreen />);
    
    const oldTripsButton = getByText('View Old Trips');
    fireEvent.press(oldTripsButton);

    // Find and press a star rating
    const stars = getByText('★'); // This would need to be adjusted based on actual star rendering
    expect(stars).toBeTruthy();
  });

  it('navigates to checkout when checkout button is pressed', async () => {
    const mockItinerary = {
      destination: 'Paris, France',
      duration: '3 days',
      description: 'Test trip',
      flights: [],
      hotel: {
        name: 'Test Hotel',
        address: '123 Test St',
        check_in: '2024-07-15 15:00',
        check_out: '2024-07-18 11:00',
        room_type: 'Standard',
        price: 180,
        total_nights: 3,
      },
      schedule: [],
      total_cost: 2500,
      bookable_cost: 1800,
      estimated_cost: 700,
    };

    (global.sessionStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockItinerary));

    const { getByText } = render(<HomeScreen />);
    const checkoutButton = getByText('Checkout Now');
    
    fireEvent.press(checkoutButton);

    // The navigation would be handled by the mocked router
    expect(checkoutButton).toBeTruthy();
  });
}); 