import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import CheckoutScreen from '@/app/checkout';

// Mock the router
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({
    scheduleId: '123',
    scheduleName: 'Paris Adventure',
    destination: 'Paris, France',
    totalCost: '2500',
  }),
  router: {
    back: jest.fn(),
    push: jest.fn(),
  },
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.localStorage = mockLocalStorage;

describe('CheckoutScreen', () => {
  const mockSchedule = {
    id: '123',
    name: 'Paris Adventure',
    destination: 'Paris, France',
    duration: '3 days',
    savedAt: '2024-07-15T10:00:00.000Z',
    status: 'unbooked',
    itinerary: {
      destination: 'Paris, France',
      duration: '3 days',
      total_cost: 2500,
      bookable_cost: 1800,
      estimated_cost: 700,
    },
    schedule: [
      {
        day: 1,
        date: '2024-08-15',
        activities: [
          {
            name: 'Eiffel Tower',
            time: '09:00',
            price: 25,
            type: 'bookable',
            description: 'Visit the iconic tower',
          },
        ],
      },
    ],
    tripStartDate: '2024-08-15T00:00:00.000Z',
    tripEndDate: '2024-08-18T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockSchedule]));
    mockLocalStorage.setItem.mockReturnValue(undefined);
  });

  it('renders correctly with schedule information', () => {
    const { getByText } = render(<CheckoutScreen />);

    expect(getByText('Checkout')).toBeTruthy();
    expect(getByText('Paris Adventure')).toBeTruthy();
    expect(getByText('Paris, France')).toBeTruthy();
    expect(getByText('3 days')).toBeTruthy();
    expect(getByText('$2,500')).toBeTruthy();
  });

  it('shows trip summary details', () => {
    const { getByText } = render(<CheckoutScreen />);

    expect(getByText('Trip Summary')).toBeTruthy();
    expect(getByText('Start Date')).toBeTruthy();
    expect(getByText('End Date')).toBeTruthy();
    expect(getByText('Total Cost')).toBeTruthy();
    expect(getByText('Bookable Cost')).toBeTruthy();
    expect(getByText('Estimated Cost')).toBeTruthy();
  });

  it('displays cost breakdown correctly', () => {
    const { getByText } = render(<CheckoutScreen />);

    expect(getByText('$1,800')).toBeTruthy(); // Bookable cost
    expect(getByText('$700')).toBeTruthy()); // Estimated cost
    expect(getByText('$2,500')).toBeTruthy(); // Total cost
  });

  it('shows payment form fields', () => {
    const { getByText, getByPlaceholderText } = render(<CheckoutScreen />);

    expect(getByText('Payment Information')).toBeTruthy();
    expect(getByPlaceholderText('Card Number')).toBeTruthy();
    expect(getByPlaceholderText('MM/YY')).toBeTruthy();
    expect(getByPlaceholderText('CVC')).toBeTruthy();
    expect(getByPlaceholderText('Cardholder Name')).toBeTruthy();
  });

  it('shows billing address form', () => {
    const { getByText, getByPlaceholderText } = render(<CheckoutScreen />);

    expect(getByText('Billing Address')).toBeTruthy();
    expect(getByPlaceholderText('Street Address')).toBeTruthy();
    expect(getByPlaceholderText('City')).toBeTruthy();
    expect(getByPlaceholderText('State/Province')).toBeTruthy();
    expect(getByPlaceholderText('ZIP/Postal Code')).toBeTruthy();
    expect(getByPlaceholderText('Country')).toBeTruthy();
  });

  it('shows terms and conditions checkbox', () => {
    const { getByText } = render(<CheckoutScreen />);

    expect(getByText('I agree to the Terms and Conditions')).toBeTruthy();
  });

  it('shows privacy policy checkbox', () => {
    const { getByText } = render(<CheckoutScreen />);

    expect(getByText('I agree to the Privacy Policy')).toBeTruthy();
  });

  it('shows complete booking button', () => {
    const { getByText } = render(<CheckoutScreen />);

    expect(getByText('Complete Booking')).toBeTruthy();
  });

  it('validates required fields before submission', async () => {
    const { getByText } = render(<CheckoutScreen />);

    const completeButton = getByText('Complete Booking');
    
    await act(async () => {
      fireEvent.press(completeButton);
    });

    // Should show validation errors
    expect(getByText('Please fill in all required fields')).toBeTruthy();
  });

  it('requires terms and conditions acceptance', async () => {
    const { getByText } = render(<CheckoutScreen />);

    // Fill in required fields but don't check terms
    const cardNumberInput = getByPlaceholderText('Card Number');
    const cardholderInput = getByPlaceholderText('Cardholder Name');
    const streetInput = getByPlaceholderText('Street Address');
    const cityInput = getByPlaceholderText('City');
    const zipInput = getByPlaceholderText('ZIP/Postal Code');

    fireEvent.changeText(cardNumberInput, '4111111111111111');
    fireEvent.changeText(cardholderInput, 'John Doe');
    fireEvent.changeText(streetInput, '123 Main St');
    fireEvent.changeText(cityInput, 'New York');
    fireEvent.changeText(zipInput, '10001');

    const completeButton = getByText('Complete Booking');
    
    await act(async () => {
      fireEvent.press(completeButton);
    });

    // Should show terms acceptance error
    expect(getByText('Please accept the terms and conditions')).toBeTruthy();
  });

  it('requires privacy policy acceptance', async () => {
    const { getByText } = render(<CheckoutScreen />);

    // Fill in required fields and check terms but not privacy
    const cardNumberInput = getByPlaceholderText('Card Number');
    const cardholderInput = getByPlaceholderText('Cardholder Name');
    const streetInput = getByPlaceholderText('Street Address');
    const cityInput = getByPlaceholderText('City');
    const zipInput = getByPlaceholderText('ZIP/Postal Code');

    fireEvent.changeText(cardNumberInput, '4111111111111111');
    fireEvent.changeText(cardholderInput, 'John Doe');
    fireEvent.changeText(streetInput, '123 Main St');
    fireEvent.changeText(cityInput, 'New York');
    fireEvent.changeText(zipInput, '10001');

    // Check terms checkbox
    const termsCheckbox = getByText('I agree to the Terms and Conditions');
    fireEvent.press(termsCheckbox);

    const completeButton = getByText('Complete Booking');
    
    await act(async () => {
      fireEvent.press(completeButton);
    });

    // Should show privacy policy acceptance error
    expect(getByText('Please accept the privacy policy')).toBeTruthy();
  });

  it('validates card number format', async () => {
    const { getByText, getByPlaceholderText } = render(<CheckoutScreen />);

    const cardNumberInput = getByPlaceholderText('Card Number');
    fireEvent.changeText(cardNumberInput, '1234');

    const completeButton = getByText('Complete Booking');
    
    await act(async () => {
      fireEvent.press(completeButton);
    });

    // Should show invalid card number error
    expect(getByText('Please enter a valid card number')).toBeTruthy();
  });

  it('validates expiration date format', async () => {
    const { getByText, getByPlaceholderText } = render(<CheckoutScreen />);

    const expiryInput = getByPlaceholderText('MM/YY');
    fireEvent.changeText(expiryInput, '13/25');

    const completeButton = getByText('Complete Booking');
    
    await act(async () => {
      fireEvent.press(completeButton);
    });

    // Should show invalid expiration date error
    expect(getByText('Please enter a valid expiration date')).toBeTruthy();
  });

  it('validates CVC format', async () => {
    const { getByText, getByPlaceholderText } = render(<CheckoutScreen />);

    const cvcInput = getByPlaceholderText('CVC');
    fireEvent.changeText(cvcInput, '12');

    const completeButton = getByText('Complete Booking');
    
    await act(async () => {
      fireEvent.press(completeButton);
    });

    // Should show invalid CVC error
    expect(getByText('Please enter a valid CVC')).toBeTruthy();
  });

  it('submits form successfully with valid data', async () => {
    const { getByText, getByPlaceholderText } = render(<CheckoutScreen />);

    // Fill in all required fields
    const cardNumberInput = getByPlaceholderText('Card Number');
    const expiryInput = getByPlaceholderText('MM/YY');
    const cvcInput = getByPlaceholderText('CVC');
    const cardholderInput = getByPlaceholderText('Cardholder Name');
    const streetInput = getByPlaceholderText('Street Address');
    const cityInput = getByPlaceholderText('City');
    const zipInput = getByPlaceholderText('ZIP/Postal Code');

    fireEvent.changeText(cardNumberInput, '4111111111111111');
    fireEvent.changeText(expiryInput, '12/25');
    fireEvent.changeText(cvcInput, '123');
    fireEvent.changeText(cardholderInput, 'John Doe');
    fireEvent.changeText(streetInput, '123 Main St');
    fireEvent.changeText(cityInput, 'New York');
    fireEvent.changeText(zipInput, '10001');

    // Check both checkboxes
    const termsCheckbox = getByText('I agree to the Terms and Conditions');
    const privacyCheckbox = getByText('I agree to the Privacy Policy');
    fireEvent.press(termsCheckbox);
    fireEvent.press(privacyCheckbox);

    const completeButton = getByText('Complete Booking');
    
    await act(async () => {
      fireEvent.press(completeButton);
    });

    // Should show success message
    expect(getByText('Booking Successful!')).toBeTruthy();
    expect(getByText('Your trip has been booked successfully.')).toBeTruthy();
  });

  it('updates schedule status to booked after successful checkout', async () => {
    const { getByText, getByPlaceholderText } = render(<CheckoutScreen />);

    // Fill in all required fields
    const cardNumberInput = getByPlaceholderText('Card Number');
    const expiryInput = getByPlaceholderText('MM/YY');
    const cvcInput = getByPlaceholderText('CVC');
    const cardholderInput = getByPlaceholderText('Cardholder Name');
    const streetInput = getByPlaceholderText('Street Address');
    const cityInput = getByPlaceholderText('City');
    const zipInput = getByPlaceholderText('ZIP/Postal Code');

    fireEvent.changeText(cardNumberInput, '4111111111111111');
    fireEvent.changeText(expiryInput, '12/25');
    fireEvent.changeText(cvcInput, '123');
    fireEvent.changeText(cardholderInput, 'John Doe');
    fireEvent.changeText(streetInput, '123 Main St');
    fireEvent.changeText(cityInput, 'New York');
    fireEvent.changeText(zipInput, '10001');

    // Check both checkboxes
    const termsCheckbox = getByText('I agree to the Terms and Conditions');
    const privacyCheckbox = getByText('I agree to the Privacy Policy');
    fireEvent.press(termsCheckbox);
    fireEvent.press(privacyCheckbox);

    const completeButton = getByText('Complete Booking');
    
    await act(async () => {
      fireEvent.press(completeButton);
    });

    // Should update localStorage with booked status
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'savedSchedules',
      expect.stringContaining('"status":"booked"')
    );
  });

  it('shows loading state during form submission', async () => {
    const { getByText, getByPlaceholderText } = render(<CheckoutScreen />);

    // Fill in all required fields
    const cardNumberInput = getByPlaceholderText('Card Number');
    const expiryInput = getByPlaceholderText('MM/YY');
    const cvcInput = getByPlaceholderText('CVC');
    const cardholderInput = getByPlaceholderText('Cardholder Name');
    const streetInput = getByPlaceholderText('Street Address');
    const cityInput = getByPlaceholderText('City');
    const zipInput = getByPlaceholderText('ZIP/Postal Code');

    fireEvent.changeText(cardNumberInput, '4111111111111111');
    fireEvent.changeText(expiryInput, '12/25');
    fireEvent.changeText(cvcInput, '123');
    fireEvent.changeText(cardholderInput, 'John Doe');
    fireEvent.changeText(streetInput, '123 Main St');
    fireEvent.changeText(cityInput, 'New York');
    fireEvent.changeText(zipInput, '10001');

    // Check both checkboxes
    const termsCheckbox = getByText('I agree to the Terms and Conditions');
    const privacyCheckbox = getByText('I agree to the Privacy Policy');
    fireEvent.press(termsCheckbox);
    fireEvent.press(privacyCheckbox);

    const completeButton = getByText('Complete Booking');
    
    await act(async () => {
      fireEvent.press(completeButton);
    });

    // Should show loading state
    expect(getByText('Processing...')).toBeTruthy();
  });

  it('handles form submission errors gracefully', async () => {
    // Mock localStorage to throw error
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('Storage error');
    });

    const { getByText, getByPlaceholderText } = render(<CheckoutScreen />);

    // Fill in all required fields
    const cardNumberInput = getByPlaceholderText('Card Number');
    const expiryInput = getByPlaceholderText('MM/YY');
    const cvcInput = getByPlaceholderText('CVC');
    const cardholderInput = getByPlaceholderText('Cardholder Name');
    const streetInput = getByPlaceholderText('Street Address');
    const cityInput = getByPlaceholderText('City');
    const zipInput = getByPlaceholderText('ZIP/Postal Code');

    fireEvent.changeText(cardNumberInput, '4111111111111111');
    fireEvent.changeText(expiryInput, '12/25');
    fireEvent.changeText(cvcInput, '123');
    fireEvent.changeText(cardholderInput, 'John Doe');
    fireEvent.changeText(streetInput, '123 Main St');
    fireEvent.changeText(cityInput, 'New York');
    fireEvent.changeText(zipInput, '10001');

    // Check both checkboxes
    const termsCheckbox = getByText('I agree to the Terms and Conditions');
    const privacyCheckbox = getByText('I agree to the Privacy Policy');
    fireEvent.press(termsCheckbox);
    fireEvent.press(privacyCheckbox);

    const completeButton = getByText('Complete Booking');
    
    await act(async () => {
      fireEvent.press(completeButton);
    });

    // Should show error message
    expect(getByText('An error occurred during checkout')).toBeTruthy();
    expect(getByText('Please try again or contact support')).toBeTruthy();
  });

  it('navigates back when back button is pressed', () => {
    const mockRouter = require('expo-router');
    const { getByText } = render(<CheckoutScreen />);

    const backButton = getByText('← Back');
    fireEvent.press(backButton);

    expect(mockRouter.router.back).toHaveBeenCalled();
  });

  it('shows trip dates correctly', () => {
    const { getByText } = render(<CheckoutScreen />);

    expect(getByText('Aug 15, 2024')).toBeTruthy(); // Start date
    expect(getByText('Aug 18, 2024')).toBeTruthy(); // End date
  });

  it('displays activity summary', () => {
    const { getByText } = render(<CheckoutScreen />);

    expect(getByText('Activity Summary')).toBeTruthy();
    expect(getByText('Day 1 - Aug 15, 2024')).toBeTruthy();
    expect(getByText('Eiffel Tower')).toBeTruthy();
    expect(getByText('$25')).toBeTruthy();
  });
});
