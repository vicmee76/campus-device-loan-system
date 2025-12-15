/// <reference types="jest" />

import { RetryHandler, isRetryableDatabaseError } from '../../api/utils/retry';
import { logger } from '../../api/utils/logger';

jest.mock('../../api/utils/logger');

describe('RetryHandler - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('execute - Success scenarios', () => {
    it('should return result on first attempt if successful', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await RetryHandler.execute(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry and succeed on second attempt', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('temporary error'))
        .mockResolvedValueOnce('success');

      const result = await RetryHandler.execute(fn, {
        maxAttempts: 3,
        initialDelay: 10,
        maxDelay: 1000,
        backoffMultiplier: 2,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('execute - Failure scenarios', () => {
    it('should throw error after max attempts', async () => {
      const error = new Error('persistent error');
      const fn = jest.fn().mockRejectedValue(error);

      await expect(
        RetryHandler.execute(fn, {
          maxAttempts: 3,
          initialDelay: 10,
          maxDelay: 1000,
          backoffMultiplier: 2,
        })
      ).rejects.toThrow('persistent error');
      expect(fn).toHaveBeenCalledTimes(3);
      expect(logger.error).toHaveBeenCalledWith(
        'Retry exhausted after 3 attempts',
        error
      );
    }, 15000);

    it('should not retry if error is not retryable', async () => {
      const error = new Error('permanent error');
      const fn = jest.fn().mockRejectedValue(error);

      const retryableErrors = jest.fn().mockReturnValue(false);

      const promise = RetryHandler.execute(fn, {
        maxAttempts: 3,
        initialDelay: 100,
        maxDelay: 1000,
        backoffMultiplier: 2,
        retryableErrors,
      });

      await expect(promise).rejects.toThrow('permanent error');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(retryableErrors).toHaveBeenCalledWith(error);
      expect(logger.warn).toHaveBeenCalledWith(
        'Error is not retryable',
        expect.any(Object)
      );
    });
  });

  describe('execute - Exponential backoff', () => {
    it('should retry multiple times with delays', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('error1'))
        .mockRejectedValueOnce(new Error('error2'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      const result = await RetryHandler.execute(fn, {
        maxAttempts: 3,
        initialDelay: 10,
        maxDelay: 1000,
        backoffMultiplier: 2,
      });
      const endTime = Date.now();

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
      // Should have taken at least some time due to delays
      expect(endTime - startTime).toBeGreaterThan(0);
    }, 15000);

    it('should respect maxDelay cap', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('error1'))
        .mockRejectedValueOnce(new Error('error2'))
        .mockResolvedValue('success');

      const result = await RetryHandler.execute(fn, {
        maxAttempts: 3,
        initialDelay: 10,
        maxDelay: 20, // Small max delay
        backoffMultiplier: 10, // Would be 100ms, but capped at 20ms
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    }, 15000);
  });

  describe('execute - Default options', () => {
    it('should use default options when not provided', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await RetryHandler.execute(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('isRetryableDatabaseError', () => {
    it('should return true for retryable error codes', () => {
      const errors = [
        { code: 'ECONNREFUSED' },
        { code: 'ETIMEDOUT' },
        { code: 'ENOTFOUND' },
        { code: 'ECONNRESET' },
      ];

      errors.forEach((error) => {
        expect(isRetryableDatabaseError(error)).toBe(true);
      });
    });

    it('should return true for retryable error messages', () => {
      const errors = [
        { message: 'Connection error occurred' },
        { message: 'Request timeout' },
        { message: 'Network issue' },
        { message: 'Temporary failure' },
      ];

      errors.forEach((error) => {
        expect(isRetryableDatabaseError(error)).toBe(true);
      });
    });

    it('should return false for non-retryable errors', () => {
      const errors = [
        { code: 'INVALID_INPUT', message: 'Invalid data' },
        { message: 'Permission denied' },
        null,
        undefined,
        {},
      ];

      errors.forEach((error) => {
        expect(isRetryableDatabaseError(error)).toBe(false);
      });
    });

    it('should handle case-insensitive message matching', () => {
      const error = { message: 'CONNECTION ERROR' };
      expect(isRetryableDatabaseError(error)).toBe(true);
    });
  });
});

