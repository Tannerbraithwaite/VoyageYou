import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import DatePicker from '@/components/DatePicker';

describe('DatePicker', () => {
  const mockTripDates = {
    startDate: null,
    endDate: null,
    isFlexible: false,
  };

  const mockOnDatesChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with initial state', () => {
    const { getByText } = render(
      <DatePicker tripDates={mockTripDates} onDatesChange={mockOnDatesChange} />
    );

    expect(getByText('Trip Dates')).toBeTruthy();
    expect(getByText('Select Start')).toBeTruthy();
    expect(getByText('Select End')).toBeTruthy();
    expect(getByText('Flexible with dates')).toBeTruthy();
  });

  it('shows selected dates when dates are set', () => {
    const tripDatesWithDates = {
      startDate: new Date('2024-07-15'),
      endDate: new Date('2024-07-18'),
      isFlexible: false,
    };

    const { getByText } = render(
      <DatePicker tripDates={tripDatesWithDates} onDatesChange={mockOnDatesChange} />
    );

    expect(getByText(/Start: Mon, Jul 15, 2024/)).toBeTruthy();
    expect(getByText(/End: Thu, Jul 18, 2024/)).toBeTruthy();
  });

  it('calls onDatesChange when start date is selected', async () => {
    const { getByText } = render(
      <DatePicker tripDates={mockTripDates} onDatesChange={mockOnDatesChange} />
    );

    const startDateButton = getByText('Select Start');
    fireEvent.press(startDateButton);

    await waitFor(() => {
      expect(mockOnDatesChange).toHaveBeenCalled();
    });
  });

  it('calls onDatesChange when end date is selected', async () => {
    const { getByText } = render(
      <DatePicker tripDates={mockTripDates} onDatesChange={mockOnDatesChange} />
    );

    const endDateButton = getByText('Select End');
    fireEvent.press(endDateButton);

    await waitFor(() => {
      expect(mockOnDatesChange).toHaveBeenCalled();
    });
  });

  it('toggles flexible dates when button is pressed', () => {
    const { getByText } = render(
      <DatePicker tripDates={mockTripDates} onDatesChange={mockOnDatesChange} />
    );

    const flexibleButton = getByText('Flexible with dates');
    fireEvent.press(flexibleButton);

    expect(mockOnDatesChange).toHaveBeenCalledWith({
      ...mockTripDates,
      isFlexible: true,
    });
  });

  it('clears dates when clear button is pressed', () => {
    const tripDatesWithDates = {
      startDate: new Date('2024-07-15'),
      endDate: new Date('2024-07-18'),
      isFlexible: true,
    };

    const { getByText } = render(
      <DatePicker tripDates={tripDatesWithDates} onDatesChange={mockOnDatesChange} />
    );

    const clearButton = getByText('Clear');
    fireEvent.press(clearButton);

    expect(mockOnDatesChange).toHaveBeenCalledWith({
      startDate: null,
      endDate: null,
      isFlexible: false,
    });
  });

  it('shows flexible indicator when isFlexible is true', () => {
    const flexibleTripDates = {
      startDate: new Date('2024-07-15'),
      endDate: new Date('2024-07-18'),
      isFlexible: true,
    };

    const { getByText } = render(
      <DatePicker tripDates={flexibleTripDates} onDatesChange={mockOnDatesChange} />
    );

    expect(getByText('(flexible)')).toBeTruthy();
  });

  it('shows duration when both dates are set', () => {
    const tripDatesWithDates = {
      startDate: new Date('2024-07-15'),
      endDate: new Date('2024-07-18'),
      isFlexible: false,
    };

    const { getByText } = render(
      <DatePicker tripDates={tripDatesWithDates} onDatesChange={mockOnDatesChange} />
    );

    expect(getByText(/Duration: 3 days/)).toBeTruthy();
  });
}); 