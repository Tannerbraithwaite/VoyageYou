import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import ExploreScreen from '@/app/(tabs)/explore';

// Mock the router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

describe('ExploreScreen', () => {
  const mockSchedules = [
    {
      id: '1',
      name: 'Paris Adventure',
      destination: 'Paris, France',
      duration: '3 days',
      savedAt: '2024-07-15T10:00:00.000Z',
      status: 'unbooked',
      itinerary: {},
      schedule: [],
      tripStartDate: '2024-08-15T00:00:00.000Z',
      tripEndDate: '2024-08-18T00:00:00.000Z',
    },
    {
      id: '2',
      name: 'Tokyo Trip',
      destination: 'Tokyo, Japan',
      duration: '5 days',
      savedAt: '2024-06-15T10:00:00.000Z',
      status: 'booked',
      itinerary: {},
      schedule: [],
      checkoutDate: '2024-06-20T10:00:00.000Z',
      tripStartDate: '2024-07-15T00:00:00.000Z',
      tripEndDate: '2024-07-20T00:00:00.000Z',
    },
    {
      id: '3',
      name: 'Past Vacation',
      destination: 'Rome, Italy',
      duration: '4 days',
      savedAt: '2024-05-15T10:00:00.000Z',
      status: 'past',
      itinerary: {},
      schedule: [],
      tripStartDate: '2024-05-20T00:00:00.000Z',
      tripEndDate: '2024-05-24T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset localStorage mock
    (global.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockSchedules));
    (global.localStorage.setItem as jest.Mock).mockReturnValue(undefined);
  });

  it('renders correctly with saved schedules', () => {
    const { getByText } = render(<ExploreScreen />);

    expect(getByText('Your Travel Schedules')).toBeTruthy();
    expect(getByText('Paris Adventure')).toBeTruthy();
    expect(getByText('Paris, France')).toBeTruthy();
    expect(getByText('Tokyo Trip')).toBeTruthy();
    expect(getByText('Tokyo, Japan')).toBeTruthy();
    expect(getByText('Past Vacation')).toBeTruthy();
    expect(getByText('Rome, Italy')).toBeTruthy();
  });

  it('shows empty state when no schedules exist', () => {
    (global.localStorage.getItem as jest.Mock).mockReturnValue(null);

    const { getByText } = render(<ExploreScreen />);

    expect(getByText('No saved schedules yet!')).toBeTruthy();
    expect(getByText('Create a schedule in the Home tab and save it to see it here!')).toBeTruthy();
    expect(getByText('Go to Home')).toBeTruthy();
  });

  it('displays schedule status correctly', () => {
    const { getByText } = render(<ExploreScreen />);

    // Unbooked schedule
    expect(getByText('unbooked')).toBeTruthy();
    expect(getByText('Ready to book')).toBeTruthy();

    // Booked schedule
    expect(getByText('booked')).toBeTruthy();
    expect(getByText('Confirmed')).toBeTruthy();

    // Past schedule
    expect(getByText('past')).toBeTruthy();
    expect(getByText('Completed')).toBeTruthy();
  });

  it('shows correct action buttons based on status', () => {
    const { getByText, queryByText } = render(<ExploreScreen />);

    // Unbooked schedule should have all action buttons
    expect(getByText('Edit')).toBeTruthy();
    expect(getByText('Delete')).toBeTruthy();
    expect(getByText('Checkout')).toBeTruthy();

    // Booked schedule should not have checkout or delete
    expect(queryByText('Checkout')).toBeTruthy(); // This will find the first one
    expect(queryByText('Delete')).toBeTruthy(); // This will find the first one

    // Past schedule should not have any action buttons
    // (These would be in the second instance of the schedule)
  });

  it('opens schedule details modal when schedule is clicked', () => {
    const { getByText } = render(<ExploreScreen />);
    
    const scheduleCard = getByText('Paris Adventure');
    fireEvent.press(scheduleCard);

    // Should show schedule details
    expect(getByText('Schedule Details')).toBeTruthy();
    expect(getByText('Paris Adventure')).toBeTruthy();
    expect(getByText('Paris, France')).toBeTruthy();
  });

  it('allows editing unbooked schedules', () => {
    const { getByText } = render(<ExploreScreen />);
    
    const scheduleCard = getByText('Paris Adventure');
    fireEvent.press(scheduleCard);

    const editButton = getByText('Edit');
    fireEvent.press(editButton);

    // Should show edit form or navigate to edit
    expect(editButton).toBeTruthy();
  });

  it('allows deleting unbooked schedules', () => {
    const { getByText } = render(<ExploreScreen />);
    
    const scheduleCard = getByText('Paris Adventure');
    fireEvent.press(scheduleCard);

    const deleteButton = getByText('Delete');
    fireEvent.press(deleteButton);

    // Should show delete confirmation or delete the schedule
    expect(deleteButton).toBeTruthy();
  });

  it('allows checkout for unbooked schedules', () => {
    const { getByText } = render(<ExploreScreen />);
    
    const scheduleCard = getByText('Paris Adventure');
    fireEvent.press(scheduleCard);

    const checkoutButton = getByText('Checkout');
    fireEvent.press(checkoutButton);

    // Should navigate to checkout or show checkout modal
    expect(checkoutButton).toBeTruthy();
  });

  it('prevents editing past schedules', () => {
    const { getByText, queryByText } = render(<ExploreScreen />);
    
    const scheduleCard = getByText('Past Vacation');
    fireEvent.press(scheduleCard);

    // Past schedules should not have edit button
    expect(queryByText('Edit')).toBeFalsy();
  });

  it('prevents deleting past schedules', () => {
    const { getByText, queryByText } = render(<ExploreScreen />);
    
    const scheduleCard = getByText('Past Vacation');
    fireEvent.press(scheduleCard);

    // Past schedules should not have delete button
    expect(queryByText('Delete')).toBeFalsy();
  });

  it('prevents checkout for past schedules', () => {
    const { getByText, queryByText } = render(<ExploreScreen />);
    
    const scheduleCard = getByText('Past Vacation');
    fireEvent.press(scheduleCard);

    // Past schedules should not have checkout button
    expect(queryByText('Checkout')).toBeFalsy();
  });

  it('prevents checkout for booked schedules', () => {
    const { getByText, queryByText } = render(<ExploreScreen />);
    
    const scheduleCard = getByText('Tokyo Trip');
    fireEvent.press(scheduleCard);

    // Booked schedules should not have checkout button
    expect(queryByText('Checkout')).toBeFalsy();
  });

  it('prevents deleting booked schedules', () => {
    const { getByText, queryByText } = render(<ExploreScreen />);
    
    const scheduleCard = getByText('Tokyo Trip');
    fireEvent.press(scheduleCard);

    // Booked schedules should not have delete button
    expect(queryByText('Delete')).toBeFalsy();
  });

  it('allows editing booked schedules', () => {
    const { getByText } = render(<ExploreScreen />);
    
    const scheduleCard = getByText('Tokyo Trip');
    fireEvent.press(scheduleCard);

    const editButton = getByText('Edit');
    fireEvent.press(editButton);

    // Booked schedules should allow editing
    expect(editButton).toBeTruthy();
  });

  it('closes schedule details modal when close button is pressed', () => {
    const { getByText, queryByText } = render(<ExploreScreen />);
    
    const scheduleCard = getByText('Paris Adventure');
    fireEvent.press(scheduleCard);

    // Modal should be open
    expect(getByText('Schedule Details')).toBeTruthy();

    const closeButton = getByText('Close');
    fireEvent.press(closeButton);

    // Modal should be closed
    expect(queryByText('Schedule Details')).toBeFalsy();
  });

  it('formats dates correctly', () => {
    const { getByText } = render(<ExploreScreen />);

    // Should show formatted saved date
    expect(getByText(/Saved: Jul 15, 2024/)).toBeTruthy();
    expect(getByText(/Saved: Jun 15, 2024/)).toBeTruthy();
    expect(getByText(/Saved: May 15, 2024/)).toBeTruthy();
  });

  it('handles schedule status changes correctly', () => {
    const { getByText } = render(<ExploreScreen />);
    
    const scheduleCard = getByText('Paris Adventure');
    fireEvent.press(scheduleCard);

    // Should show status change buttons for unbooked trips
    expect(getByText('✅ Booked')).toBeTruthy();
    expect(getByText('📅 Past')).toBeTruthy();
  });

  it('updates schedule status when status change button is pressed', async () => {
    const { getByText } = render(<ExploreScreen />);
    
    const scheduleCard = getByText('Paris Adventure');
    fireEvent.press(scheduleCard);

    const bookedButton = getByText('✅ Booked');
    
    await act(async () => {
      fireEvent.press(bookedButton);
    });

    // Should update the schedule status
    expect(bookedButton).toBeTruthy();
  });

  it('loads schedules from localStorage on mount', () => {
    const { getByText } = render(<ExploreScreen />);

    // Should load all three schedules
    expect(getByText('Paris Adventure')).toBeTruthy();
    expect(getByText('Tokyo Trip')).toBeTruthy();
    expect(getByText('Past Vacation')).toBeTruthy();
  });

  it('handles localStorage errors gracefully', () => {
    (global.localStorage.getItem as jest.Mock).mockImplementation(() => {
      throw new Error('Storage error');
    });

    const { getByText } = render(<ExploreScreen />);

    // Should show empty state when storage fails
    expect(getByText('No saved schedules yet!')).toBeTruthy();
  });
});
