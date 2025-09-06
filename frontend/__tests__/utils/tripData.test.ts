import { formatDateForChat, calculateTripDuration } from '@/utils/tripData';

describe('Trip Data Utils', () => {
  describe('formatDateForChat', () => {
    it('formats date correctly', () => {
      const date = new Date('2024-07-15');
      const formatted = formatDateForChat(date);
      expect(formatted).toBe('Monday, July 15, 2024');
    });

    it('handles different date formats', () => {
      const date1 = new Date('2024-12-25');
      const date2 = new Date('2024-01-01');
      
      expect(formatDateForChat(date1)).toBe('Wednesday, December 25, 2024');
      expect(formatDateForChat(date2)).toBe('Monday, January 1, 2024');
    });

    it('handles null date', () => {
      expect(formatDateForChat(null)).toBe('');
    });
  });

  describe('calculateTripDuration', () => {
    it('calculates duration correctly for same day', () => {
      const startDate = new Date('2024-07-15');
      const endDate = new Date('2024-07-15');
      const duration = calculateTripDuration(startDate, endDate);
      expect(duration).toBe('1 day');
    });

    it('calculates duration correctly for multiple days', () => {
      const startDate = new Date('2024-07-15');
      const endDate = new Date('2024-07-18');
      const duration = calculateTripDuration(startDate, endDate);
      expect(duration).toBe('4 days');
    });

    it('calculates duration correctly for weeks', () => {
      const startDate = new Date('2024-07-15');
      const endDate = new Date('2024-07-29');
      const duration = calculateTripDuration(startDate, endDate);
      expect(duration).toBe('15 days');
    });

    it('handles null dates', () => {
      expect(calculateTripDuration(null, null)).toBe('0 days');
      expect(calculateTripDuration(new Date('2024-07-15'), null)).toBe('0 days');
      expect(calculateTripDuration(null, new Date('2024-07-18'))).toBe('0 days');
    });

    it('handles invalid date order', () => {
      const startDate = new Date('2024-07-18');
      const endDate = new Date('2024-07-15');
      const duration = calculateTripDuration(startDate, endDate);
      expect(duration).toBe('0 days');
    });
  });
}); 