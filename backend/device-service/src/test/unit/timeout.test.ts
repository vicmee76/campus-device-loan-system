/// <reference types="jest" />

import { withTimeout, TimeoutError } from '../../api/utils/timeout';

jest.useFakeTimers();

describe('Timeout Utility - Unit Tests', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  describe('withTimeout', () => {
    it('should return result if promise resolves before timeout', async () => {
      const promise = Promise.resolve('success');
      const timeoutPromise = withTimeout(promise, 1000);

      jest.advanceTimersByTime(500);

      const result = await timeoutPromise;
      expect(result).toBe('success');
    });

    it('should throw TimeoutError if promise exceeds timeout', async () => {
      const promise = new Promise((resolve) => {
        setTimeout(() => resolve('success'), 2000);
      });

      const timeoutPromise = withTimeout(promise, 1000);

      jest.advanceTimersByTime(1000);

      await expect(timeoutPromise).rejects.toThrow(TimeoutError);
      await expect(timeoutPromise).rejects.toThrow(
        'Operation timed out after 1000ms'
      );
    });

    it('should use custom error message if provided', async () => {
      const promise = new Promise((resolve) => {
        setTimeout(() => resolve('success'), 2000);
      });

      const timeoutPromise = withTimeout(promise, 1000, 'Custom timeout message');

      jest.advanceTimersByTime(1000);

      await expect(timeoutPromise).rejects.toThrow('Custom timeout message');
    });

    it('should handle promise rejection before timeout', async () => {
      const error = new Error('Promise rejected');
      const promise = Promise.reject(error);

      const timeoutPromise = withTimeout(promise, 1000);

      await expect(timeoutPromise).rejects.toThrow('Promise rejected');
    });
  });

  describe('TimeoutError', () => {
    it('should create TimeoutError with default message', () => {
      const error = new TimeoutError();
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(TimeoutError);
      expect(error.name).toBe('TimeoutError');
      expect(error.message).toBe('Operation timed out');
    });

    it('should create TimeoutError with custom message', () => {
      const error = new TimeoutError('Custom timeout');
      expect(error.message).toBe('Custom timeout');
    });
  });
});

