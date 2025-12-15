/// <reference types="jest" />

import { CircuitBreaker, CircuitState, CircuitBreakerOptions } from '../../api/utils/circuit-breaker';
import { logger } from '../../api/utils/logger';

jest.mock('../../api/utils/logger');

describe('CircuitBreaker - Unit Tests', () => {
  let circuitBreaker: CircuitBreaker;
  const defaultOptions: CircuitBreakerOptions = {
    failureThreshold: 3,
    resetTimeout: 1000,
    monitoringPeriod: 5000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    circuitBreaker = new CircuitBreaker('test-service', defaultOptions);
  });

  describe('Initialization', () => {
    it('should initialize with CLOSED state', () => {
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should use default options when not provided', () => {
      const breaker = new CircuitBreaker('test');
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('execute - Success scenarios', () => {
    it('should execute function successfully when circuit is CLOSED', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await circuitBreaker.execute(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should reset failure count on success', async () => {
      // First, cause some failures
      const failingFn = jest.fn().mockRejectedValue(new Error('fail'));
      
      for (let i = 0; i < 2; i++) {
        try {
          await circuitBreaker.execute(failingFn);
        } catch (e) {
          // Expected to fail
        }
      }

      // Then succeed
      const successFn = jest.fn().mockResolvedValue('success');
      await circuitBreaker.execute(successFn);

      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('execute - Failure scenarios', () => {
    it('should throw error when function fails', async () => {
      const error = new Error('Test error');
      const fn = jest.fn().mockRejectedValue(error);

      await expect(circuitBreaker.execute(fn)).rejects.toThrow('Test error');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should open circuit after reaching failure threshold', async () => {
      const failingFn = jest.fn().mockRejectedValue(new Error('fail'));

      // Execute failures up to threshold
      for (let i = 0; i < defaultOptions.failureThreshold; i++) {
        try {
          await circuitBreaker.execute(failingFn);
        } catch (e) {
          // Expected to fail
        }
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should throw error immediately when circuit is OPEN', async () => {
      // Open the circuit first
      const failingFn = jest.fn().mockRejectedValue(new Error('fail'));
      for (let i = 0; i < defaultOptions.failureThreshold; i++) {
        try {
          await circuitBreaker.execute(failingFn);
        } catch (e) {
          // Expected
        }
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);

      // Try to execute - should fail immediately
      const fn = jest.fn().mockResolvedValue('success');
      await expect(circuitBreaker.execute(fn)).rejects.toThrow(
        'Circuit breaker test-service is OPEN. Service unavailable.'
      );
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('HALF_OPEN state', () => {
    it('should transition to HALF_OPEN after reset timeout', async () => {
      jest.useFakeTimers();

      // Open the circuit
      const failingFn = jest.fn().mockRejectedValue(new Error('fail'));
      for (let i = 0; i < defaultOptions.failureThreshold; i++) {
        try {
          await circuitBreaker.execute(failingFn);
        } catch (e) {
          // Expected
        }
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);

      // Fast-forward past reset timeout
      jest.advanceTimersByTime(defaultOptions.resetTimeout + 100);

      // Next execution should transition to HALF_OPEN
      const successFn = jest.fn().mockResolvedValue('success');
      await circuitBreaker.execute(successFn);

      expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN);
      expect(logger.info).toHaveBeenCalledWith(
        'Circuit breaker test-service entering HALF_OPEN state'
      );

      jest.useRealTimers();
    });

    it('should close circuit after successful recovery in HALF_OPEN', async () => {
      jest.useFakeTimers();

      // Open circuit
      const failingFn = jest.fn().mockRejectedValue(new Error('fail'));
      for (let i = 0; i < defaultOptions.failureThreshold; i++) {
        try {
          await circuitBreaker.execute(failingFn);
        } catch (e) {
          // Expected
        }
      }

      // Wait for reset timeout
      jest.advanceTimersByTime(defaultOptions.resetTimeout + 100);

      // Execute 2 successful calls in HALF_OPEN
      const successFn = jest.fn().mockResolvedValue('success');
      await circuitBreaker.execute(successFn);
      await circuitBreaker.execute(successFn);

      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      expect(logger.info).toHaveBeenCalledWith(
        'Circuit breaker test-service closed after successful recovery'
      );

      jest.useRealTimers();
    });

    it('should reopen circuit if failure occurs in HALF_OPEN', async () => {
      jest.useFakeTimers();

      // Open circuit
      const failingFn = jest.fn().mockRejectedValue(new Error('fail'));
      for (let i = 0; i < defaultOptions.failureThreshold; i++) {
        try {
          await circuitBreaker.execute(failingFn);
        } catch (e) {
          // Expected
        }
      }

      // Wait for reset timeout
      jest.advanceTimersByTime(defaultOptions.resetTimeout + 100);

      // Fail in HALF_OPEN
      try {
        await circuitBreaker.execute(failingFn);
      } catch (e) {
        // Expected
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      expect(logger.warn).toHaveBeenCalledWith(
        'Circuit breaker test-service opened again after failure in HALF_OPEN state'
      );

      jest.useRealTimers();
    });
  });

  describe('Monitoring period', () => {
    it('should reset failure count after monitoring period', async () => {
      jest.useFakeTimers();

      const failingFn = jest.fn().mockRejectedValue(new Error('fail'));

      // Cause 2 failures
      for (let i = 0; i < 2; i++) {
        try {
          await circuitBreaker.execute(failingFn);
        } catch (e) {
          // Expected
        }
      }

      // Fast-forward past monitoring period
      jest.advanceTimersByTime(defaultOptions.monitoringPeriod + 100);

      // Next failure should reset count
      try {
        await circuitBreaker.execute(failingFn);
      } catch (e) {
        // Expected
      }

      // Should still be CLOSED (only 1 failure after reset)
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);

      jest.useRealTimers();
    });
  });

  describe('reset', () => {
    it('should reset circuit to CLOSED state', async () => {
      // Open the circuit
      const failingFn = jest.fn().mockRejectedValue(new Error('fail'));
      for (let i = 0; i < defaultOptions.failureThreshold; i++) {
        try {
          await circuitBreaker.execute(failingFn);
        } catch (e) {
          // Expected
        }
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);

      // Reset
      circuitBreaker.reset();

      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      expect(logger.info).toHaveBeenCalledWith('Circuit breaker test-service manually reset');
    });
  });

  describe('getState', () => {
    it('should return current circuit state', () => {
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });
  });
});

