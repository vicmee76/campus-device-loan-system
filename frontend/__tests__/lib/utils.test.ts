import { formatDate, formatDateShort, formatRelativeTime, getErrorMessage } from '@/lib/utils';

describe('Utils', () => {
  describe('formatDate', () => {
    it('should format a date string', () => {
      const date = '2024-01-15T10:30:00Z';
      const result = formatDate(date);
      expect(result).toMatch(/Jan/);
      expect(result).toMatch(/2024/);
    });

    it('should format a Date object', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = formatDate(date);
      expect(result).toMatch(/Jan/);
      expect(result).toMatch(/2024/);
    });
  });

  describe('formatDateShort', () => {
    it('should format a date string in short format', () => {
      const date = '2024-01-15T10:30:00Z';
      const result = formatDateShort(date);
      expect(result).toMatch(/Jan/);
      expect(result).toMatch(/2024/);
    });

    it('should format a Date object in short format', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = formatDateShort(date);
      expect(result).toMatch(/Jan/);
      expect(result).toMatch(/2024/);
    });
  });

  describe('formatRelativeTime', () => {
    it('should format relative time from a date string', () => {
      const date = new Date();
      date.setMinutes(date.getMinutes() - 5);
      const result = formatRelativeTime(date.toISOString());
      expect(result).toMatch(/ago/);
    });

    it('should format relative time from a Date object', () => {
      const date = new Date();
      date.setHours(date.getHours() - 2);
      const result = formatRelativeTime(date);
      expect(result).toMatch(/ago/);
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from axios error response', () => {
      const error = {
        response: {
          data: {
            message: 'Custom error message',
          },
        },
      };
      const result = getErrorMessage(error);
      expect(result).toBe('Custom error message');
    });

    it('should extract message from error object', () => {
      const error = {
        message: 'Error message',
      };
      const result = getErrorMessage(error);
      expect(result).toBe('Error message');
    });

    it('should return default message when no message found', () => {
      const error = {};
      const result = getErrorMessage(error);
      expect(result).toBe('An unexpected error occurred');
    });

    it('should return default message for null/undefined', () => {
      expect(getErrorMessage(null)).toBe('An unexpected error occurred');
      expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
    });

    it('should prioritize response.data.message over error.message', () => {
      const error = {
        response: {
          data: {
            message: 'Response error',
          },
        },
        message: 'Error message',
      };
      const result = getErrorMessage(error);
      expect(result).toBe('Response error');
    });
  });
});

