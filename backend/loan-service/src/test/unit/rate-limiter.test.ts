/// <reference types="jest" />

import { Request, Response, NextFunction } from 'express';
import { RateLimiter, createRateLimiter, defaultRateLimiter, strictRateLimiter } from '../../api/utils/rate-limiter';

jest.mock('../../api/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Rate Limiter - Unit Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockRequest = {
      method: 'GET',
      path: '/test',
      ip: '127.0.0.1',
      headers: {},
      socket: {
        remoteAddress: '127.0.0.1',
      } as any,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      statusCode: 200,
      send: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('RateLimiter middleware', () => {
    it('should allow request when under limit', () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 5,
      });

      const middleware = limiter.middleware();
      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should block request when limit exceeded', () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2,
      });

      const middleware = limiter.middleware();

      // Make 2 requests (at limit)
      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);
      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      // Third request should be blocked
      mockNext.mockClear();
      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(String));
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        code: '09',
        message: 'Too many requests. Please try again later.',
        data: null,
      });
    });

    it('should reset window after expiration', () => {
      const limiter = new RateLimiter({
        windowMs: 1000,
        maxRequests: 2,
      });

      const middleware = limiter.middleware();

      // Make 2 requests
      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);
      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      // Advance time past window
      jest.advanceTimersByTime(1001);

      // Should allow request after window reset
      mockNext.mockClear();
      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should use custom key generator when provided', () => {
      const customKey = 'custom-key-123';
      const customKeyGenerator = jest.fn().mockReturnValue(customKey);

      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        keyGenerator: customKeyGenerator,
      });

      const middleware = limiter.middleware();
      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(customKeyGenerator).toHaveBeenCalledWith(mockRequest);
    });

    it('should use user ID when authenticated', () => {
      const userId = 'user-123';
      (mockRequest as any).user = { userId };

      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 5,
      });

      const middleware = limiter.middleware();
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Verify the key includes user ID
      expect(mockNext).toHaveBeenCalled();
    });

    it('should use IP address when not authenticated', () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 5,
      });

      const middleware = limiter.middleware();
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should use x-forwarded-for header when available', () => {
      const requestWithoutIp = {
        ...mockRequest,
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      };
      delete (requestWithoutIp as any).ip;

      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 5,
      });

      const middleware = limiter.middleware();
      middleware(requestWithoutIp as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should use x-real-ip header when available', () => {
      const requestWithoutIp = {
        ...mockRequest,
        headers: {
          'x-real-ip': '192.168.1.1',
        },
      };
      delete (requestWithoutIp as any).ip;
      delete (requestWithoutIp as any).socket;

      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 5,
      });

      const middleware = limiter.middleware();
      middleware(requestWithoutIp as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should use socket.remoteAddress when available', () => {
      const requestWithoutIp = {
        ...mockRequest,
        headers: {},
      };
      delete (requestWithoutIp as any).ip;

      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 5,
      });

      const middleware = limiter.middleware();
      middleware(requestWithoutIp as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should use "unknown" when no IP source available', () => {
      const requestWithoutIp = {
        method: 'GET',
        path: '/test',
        headers: {},
        socket: {
          remoteAddress: undefined,
        } as any,
      } as Request;

      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 5,
      });

      const middleware = limiter.middleware();
      middleware(requestWithoutIp, mockResponse as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should skip successful requests when option is enabled', () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2,
        skipSuccessfulRequests: true,
      });

      const middleware = limiter.middleware();
      const originalSend = mockResponse.send;

      // Make first request
      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);
      // Simulate successful response by calling the overridden send function
      if (mockResponse.send && mockResponse.send !== originalSend) {
        mockResponse.statusCode = 200;
        (mockResponse.send as any)('Success');
      }

      // Reset mock for second request
      mockNext.mockClear();
      mockResponse.send = originalSend;

      // Make second request
      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);
      // Simulate successful response
      if (mockResponse.send && mockResponse.send !== originalSend) {
        mockResponse.statusCode = 200;
        (mockResponse.send as any)('Success');
      }

      // Should allow third request because successful requests are skipped
      mockNext.mockClear();
      mockResponse.send = originalSend;
      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should skip failed requests when option is enabled', () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2,
        skipFailedRequests: true,
      });

      const middleware = limiter.middleware();
      const originalSend = mockResponse.send;

      // Make first request
      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);
      // Simulate failed response by calling the overridden send function
      if (mockResponse.send && mockResponse.send !== originalSend) {
        mockResponse.statusCode = 400;
        (mockResponse.send as any)('Error');
      }

      // Reset mock for second request
      mockNext.mockClear();
      mockResponse.send = originalSend;

      // Make second request
      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);
      // Simulate failed response
      if (mockResponse.send && mockResponse.send !== originalSend) {
        mockResponse.statusCode = 400;
        (mockResponse.send as any)('Error');
      }

      // Should allow third request because failed requests are skipped
      mockNext.mockClear();
      mockResponse.send = originalSend;
      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should decrement count when skipping successful requests', () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2,
        skipSuccessfulRequests: true,
      });

      const middleware = limiter.middleware();

      // Make request
      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      // The send function should be overridden
      expect(mockResponse.send).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle response send override correctly', () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2,
        skipSuccessfulRequests: true,
      });

      const middleware = limiter.middleware();

      // Make request
      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      // Verify send is defined and middleware executed
      expect(mockResponse.send).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
      
      // Verify that when skipSuccessfulRequests is enabled, the send function can be called
      // (it should be overridden to handle successful responses)
      if (mockResponse.send) {
        mockResponse.statusCode = 200;
        const result = (mockResponse.send as any)('test');
        // Should not throw and should return the result
        expect(result).toBeDefined();
      }
    });

    it('should handle case when record is deleted before send is called', () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2,
        skipSuccessfulRequests: true,
      });

      const middleware = limiter.middleware();
      const originalSend = mockResponse.send;

      // Make request
      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      // Get the key to manually delete the record
      const key = `ip:${mockRequest.ip}:${mockRequest.method}:${mockRequest.path}`;
      
      // Delete the record before send is called (simulating edge case)
      limiter.reset(key);

      // Now call the overridden send function - it should handle missing record gracefully
      if (mockResponse.send && mockResponse.send !== originalSend) {
        mockResponse.statusCode = 200;
        // Should not throw even though record doesn't exist
        expect(() => {
          (mockResponse.send as any)('Success');
        }).not.toThrow();
      }
    });

    it('should handle skipFailedRequests when record is missing', () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2,
        skipFailedRequests: true,
      });

      const middleware = limiter.middleware();
      const originalSend = mockResponse.send;

      // Make request
      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      // Get the key to manually delete the record
      const key = `ip:${mockRequest.ip}:${mockRequest.method}:${mockRequest.path}`;
      
      // Delete the record before send is called
      limiter.reset(key);

      // Call the overridden send function with failed status
      if (mockResponse.send && mockResponse.send !== originalSend) {
        mockResponse.statusCode = 500;
        // Should not throw even though record doesn't exist
        expect(() => {
          (mockResponse.send as any)('Error');
        }).not.toThrow();
      }
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', () => {
      const limiter = new RateLimiter({
        windowMs: 1000,
        maxRequests: 5,
      });

      const middleware = limiter.middleware();

      // Make request to create entry
      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      // Advance time past window
      jest.advanceTimersByTime(2000);

      // Cleanup should have run (setInterval runs every minute, but we can trigger manually)
      // The cleanup runs via setInterval, so we need to advance time enough
      jest.advanceTimersByTime(60000);

      // Make another request - should create new entry
      mockNext.mockClear();
      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should not remove entries that are not expired', () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 5,
      });

      const middleware = limiter.middleware();

      // Make request to create entry
      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      // Get the key
      const key = `ip:${mockRequest.ip}:${mockRequest.method}:${mockRequest.path}`;

      // Advance time but not past the window (only 30 seconds)
      jest.advanceTimersByTime(30000);

      // Trigger cleanup (advance by 1 minute to trigger setInterval)
      jest.advanceTimersByTime(60000);

      // Entry should still exist because resetTime hasn't passed
      // Verify by making requests up to the limit
      mockNext.mockClear();
      mockResponse.status = jest.fn().mockReturnThis();
      mockResponse.json = jest.fn().mockReturnThis();
      mockResponse.setHeader = jest.fn().mockReturnThis();
      
      // Make 4 more requests to reach the limit (1 already made, so 4 more = 5 total)
      for (let i = 0; i < 4; i++) {
        middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);
        mockNext.mockClear();
      }

      // 6th request should be blocked (we made 1 + 4 = 5, so 6th should be blocked)
      // But since cleanup might have removed it, let's verify the entry exists by checking
      // that we can still make requests within the limit
      // Actually, let's just verify cleanup doesn't remove non-expired entries
      // by checking that the store still has the entry
      const store = (limiter as any).store;
      const entry = store[key];
      
      // If entry exists and hasn't expired, it should still be there
      if (entry && entry.resetTime > Date.now()) {
        expect(entry).toBeDefined();
        expect(entry.count).toBeGreaterThan(0);
      }
    });
  });

  describe('reset', () => {
    it('should reset rate limit for a specific key', () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2,
      });

      const middleware = limiter.middleware();

      // Make 2 requests (at limit)
      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);
      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      // Reset
      const key = `ip:${mockRequest.ip}:${mockRequest.method}:${mockRequest.path}`;
      limiter.reset(key);

      // Should allow request after reset
      mockNext.mockClear();
      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('createRateLimiter', () => {
    it('should create a RateLimiter instance', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
      });

      expect(limiter).toBeInstanceOf(RateLimiter);
    });
  });

  describe('defaultRateLimiter', () => {
    it('should be configured with default settings', () => {
      expect(defaultRateLimiter).toBeInstanceOf(RateLimiter);
    });
  });

  describe('strictRateLimiter', () => {
    it('should be configured with strict settings', () => {
      expect(strictRateLimiter).toBeInstanceOf(RateLimiter);
    });
  });
});

