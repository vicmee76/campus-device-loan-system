/// <reference types="jest" />
import { RateLimiter, createRateLimiter, defaultRateLimiter, strictRateLimiter } from '../../api/utils/rate-limiter';
import { Request, Response, NextFunction } from 'express';

// Mock logger
jest.mock('../../api/utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('RateLimiter', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;

  beforeEach(() => {
    jest.useFakeTimers();
    mockReq = {
      method: 'GET',
      path: '/test',
      ip: '127.0.0.1',
      headers: {},
      socket: {
        remoteAddress: '127.0.0.1',
      } as any,
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      statusCode: 200,
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Basic rate limiting', () => {
    it('should allow requests within limit', () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 5,
      });

      const middleware = limiter.middleware();

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }

      expect(mockNext).toHaveBeenCalledTimes(5);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should block requests exceeding limit', () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 3,
      });

      const middleware = limiter.middleware();

      // Make 4 requests (3 allowed + 1 blocked)
      for (let i = 0; i < 4; i++) {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }

      expect(mockNext).toHaveBeenCalledTimes(3);
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        code: '09',
        message: 'Too many requests. Please try again later.',
        data: null,
      });
    });

    it('should set Retry-After header when limit exceeded', () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2,
      });

      const middleware = limiter.middleware();

      // Make 3 requests
      for (let i = 0; i < 3; i++) {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }

      expect(mockRes.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(String));
      const retryAfter = (mockRes.setHeader as jest.Mock).mock.calls[0][1];
      expect(parseInt(retryAfter, 10)).toBeGreaterThan(0);
      expect(parseInt(retryAfter, 10)).toBeLessThanOrEqual(60);
    });

    it('should reset window after expiration', () => {
      const limiter = new RateLimiter({
        windowMs: 1000,
        maxRequests: 2,
      });

      const middleware = limiter.middleware();

      // Make 2 requests
      middleware(mockReq as Request, mockRes as Response, mockNext);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(2);

      // Advance time past window
      jest.advanceTimersByTime(1001);

      // Should allow requests again
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(3);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('Key generation', () => {
    it('should use custom keyGenerator when provided', () => {
      const customKeyGenerator = jest.fn().mockReturnValue('custom-key');
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        keyGenerator: customKeyGenerator,
      });

      const middleware = limiter.middleware();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(customKeyGenerator).toHaveBeenCalledWith(mockReq);
    });

    it('should use user ID when authenticated', () => {
      const authenticatedReq = {
        ...mockReq,
        user: {
          userId: 'user-123',
        },
      };

      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 5,
      });

      const middleware = limiter.middleware();

      // Make another request with different user - should not be rate limited
      const authenticatedReq2 = {
        ...mockReq,
        user: {
          userId: 'user-456',
        },
      };

      // Fill up limit for user-123 (5 requests)
      for (let i = 0; i < 5; i++) {
        middleware(authenticatedReq as Request, mockRes as Response, mockNext);
      }

      // user-456 should still be able to make requests
      middleware(authenticatedReq2 as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(6); // 5 for user-123 + 1 for user-456
    });

    it('should extract IP from req.ip', () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2,
      });

      const middleware = limiter.middleware();
      middleware(mockReq as Request, mockRes as Response, mockNext);
      middleware(mockReq as Request, mockRes as Response, mockNext);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(429);
    });

    it('should extract IP from X-Forwarded-For header', () => {
      const proxiedReq = {
        ...mockReq,
        ip: undefined,
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      };

      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2,
      });

      const middleware = limiter.middleware();
      middleware(proxiedReq as Request, mockRes as Response, mockNext);
      middleware(proxiedReq as Request, mockRes as Response, mockNext);
      middleware(proxiedReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(429);
    });

    it('should extract IP from X-Real-IP header', () => {
      const proxiedReq = {
        ...mockReq,
        ip: undefined,
        headers: {
          'x-real-ip': '192.168.1.2',
        },
      };

      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2,
      });

      const middleware = limiter.middleware();
      middleware(proxiedReq as Request, mockRes as Response, mockNext);
      middleware(proxiedReq as Request, mockRes as Response, mockNext);
      middleware(proxiedReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(429);
    });

    it('should extract IP from socket.remoteAddress', () => {
      const socketReq = {
        ...mockReq,
        ip: undefined,
        headers: {},
        socket: {
          remoteAddress: '192.168.1.3',
        } as any,
      };

      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2,
      });

      const middleware = limiter.middleware();
      middleware(socketReq as Request, mockRes as Response, mockNext);
      middleware(socketReq as Request, mockRes as Response, mockNext);
      middleware(socketReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(429);
    });

    it('should use "unknown" when IP cannot be determined', () => {
      const unknownReq = {
        ...mockReq,
        ip: undefined,
        headers: {},
        socket: {
          remoteAddress: undefined,
        } as any,
      };

      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2,
      });

      const middleware = limiter.middleware();
      middleware(unknownReq as Request, mockRes as Response, mockNext);
      middleware(unknownReq as Request, mockRes as Response, mockNext);
      middleware(unknownReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(429);
    });

    it('should include endpoint in key for per-endpoint limiting', () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2,
      });

      const middleware = limiter.middleware();

      // Make requests to different endpoints
      const req1 = { ...mockReq, method: 'GET', path: '/endpoint1' };
      const req2 = { ...mockReq, method: 'POST', path: '/endpoint2' };

      middleware(req1 as Request, mockRes as Response, mockNext);
      middleware(req1 as Request, mockRes as Response, mockNext);
      middleware(req1 as Request, mockRes as Response, mockNext); // Should be blocked

      expect(mockRes.status).toHaveBeenCalledWith(429);

      // Reset mock
      (mockRes.status as jest.Mock).mockClear();
      (mockNext as jest.Mock).mockClear();

      // Different endpoint should not be blocked
      middleware(req2 as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('skipSuccessfulRequests', () => {
    it('should not count successful requests when skipSuccessfulRequests is true', () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2,
        skipSuccessfulRequests: true,
      });

      const middleware = limiter.middleware();
      const originalSend = mockRes.send;

      // Make 2 requests that will be successful
      mockRes.statusCode = 200;
      middleware(mockReq as Request, mockRes as Response, mockNext);
      // Call the wrapped send function to decrement count
      if (mockRes.send && mockRes.send !== originalSend) {
        mockRes.send('response body');
      }

      // Reset send mock for next request
      mockRes.send = jest.fn().mockReturnThis();
      mockRes.statusCode = 200;
      middleware(mockReq as Request, mockRes as Response, mockNext);
      if (mockRes.send && mockRes.send !== originalSend) {
        mockRes.send('response body');
      }

      // Should be able to make more requests since successful ones don't count
      // After 2 successful responses, count should be back to 0, so we can make 2 more
      mockRes.send = jest.fn().mockReturnThis();
      middleware(mockReq as Request, mockRes as Response, mockNext);
      if (mockRes.send && mockRes.send !== originalSend) {
        mockRes.send('response body');
      }

      mockRes.send = jest.fn().mockReturnThis();
      middleware(mockReq as Request, mockRes as Response, mockNext);
      if (mockRes.send && mockRes.send !== originalSend) {
        mockRes.send('response body');
      }

      expect(mockNext).toHaveBeenCalledTimes(4);
      expect(mockRes.status).not.toHaveBeenCalledWith(429);
    });

    it('should count failed requests when skipSuccessfulRequests is true', () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2,
        skipSuccessfulRequests: true,
      });

      const middleware = limiter.middleware();
      let wrappedSend: any;

      // Make 2 failed requests
      mockRes.statusCode = 400;
      middleware(mockReq as Request, mockRes as Response, mockNext);
      wrappedSend = mockRes.send;
      wrappedSend('error body'); // Simulate failed response

      mockRes.statusCode = 400;
      middleware(mockReq as Request, mockRes as Response, mockNext);
      wrappedSend = mockRes.send;
      wrappedSend('error body'); // Simulate failed response

      // Third failed request should be blocked
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(429);
    });
  });

  describe('skipFailedRequests', () => {
    it('should not count failed requests when skipFailedRequests is true', () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2,
        skipFailedRequests: true,
      });

      const middleware = limiter.middleware();
      const originalSend = mockRes.send;

      // Make 2 failed requests
      mockRes.statusCode = 400;
      middleware(mockReq as Request, mockRes as Response, mockNext);
      // Call the wrapped send function to decrement count
      if (mockRes.send && mockRes.send !== originalSend) {
        mockRes.send('error body');
      }

      // Reset send mock for next request
      mockRes.send = jest.fn().mockReturnThis();
      mockRes.statusCode = 400;
      middleware(mockReq as Request, mockRes as Response, mockNext);
      if (mockRes.send && mockRes.send !== originalSend) {
        mockRes.send('error body');
      }

      // Should be able to make more requests since failed ones don't count
      // After 2 failed responses, count should be back to 0, so we can make 2 more
      mockRes.send = jest.fn().mockReturnThis();
      middleware(mockReq as Request, mockRes as Response, mockNext);
      if (mockRes.send && mockRes.send !== originalSend) {
        mockRes.send('error body');
      }

      mockRes.send = jest.fn().mockReturnThis();
      middleware(mockReq as Request, mockRes as Response, mockNext);
      if (mockRes.send && mockRes.send !== originalSend) {
        mockRes.send('error body');
      }

      expect(mockNext).toHaveBeenCalledTimes(4);
      expect(mockRes.status).not.toHaveBeenCalledWith(429);
    });

    it('should count successful requests when skipFailedRequests is true', () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2,
        skipFailedRequests: true,
      });

      const middleware = limiter.middleware();
      let wrappedSend: any;

      // Make 2 successful requests
      mockRes.statusCode = 200;
      middleware(mockReq as Request, mockRes as Response, mockNext);
      wrappedSend = mockRes.send;
      wrappedSend('response body'); // Simulate successful response

      mockRes.statusCode = 200;
      middleware(mockReq as Request, mockRes as Response, mockNext);
      wrappedSend = mockRes.send;
      wrappedSend('response body'); // Simulate successful response

      // Third successful request should be blocked
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(429);
    });
  });

  describe('skipSuccessfulRequests and skipFailedRequests together', () => {
    it('should handle both options together', () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2,
        skipSuccessfulRequests: true,
        skipFailedRequests: true,
      });

      const middleware = limiter.middleware();
      let wrappedSend: any;

      // Make successful request
      mockRes.statusCode = 200;
      middleware(mockReq as Request, mockRes as Response, mockNext);
      wrappedSend = mockRes.send;
      wrappedSend('response body'); // Simulate successful response

      // Make failed request
      mockRes.statusCode = 400;
      middleware(mockReq as Request, mockRes as Response, mockNext);
      wrappedSend = mockRes.send;
      wrappedSend('error body'); // Simulate failed response

      // Both should not count, so we should still be able to make requests
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(3);
      expect(mockRes.status).not.toHaveBeenCalledWith(429);
    });
  });

  describe('cleanup', () => {
    it('should clean up expired entries', () => {
      const limiter = new RateLimiter({
        windowMs: 1000,
        maxRequests: 5,
      });

      const middleware = limiter.middleware();

      // Create entries for different keys
      const req1 = { ...mockReq, path: '/path1' };
      const req2 = { ...mockReq, path: '/path2' };

      middleware(req1 as Request, mockRes as Response, mockNext);
      middleware(req2 as Request, mockRes as Response, mockNext);

      // Advance time past window
      jest.advanceTimersByTime(1001);

      // Trigger cleanup (happens automatically via setInterval)
      jest.advanceTimersByTime(60000);

      // Both keys should be cleaned up, new requests should start fresh
      middleware(req1 as Request, mockRes as Response, mockNext);
      middleware(req2 as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should reset rate limit for specific key', () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2,
      });

      const middleware = limiter.middleware();

      // Fill up limit
      middleware(mockReq as Request, mockRes as Response, mockNext);
      middleware(mockReq as Request, mockRes as Response, mockNext);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(429);

      // Reset
      const key = `ip:${mockReq.ip}:${mockReq.method}:${mockReq.path}`;
      limiter.reset(key);

      // Should be able to make requests again
      (mockRes.status as jest.Mock).mockClear();
      (mockNext as jest.Mock).mockClear();

      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalledWith(429);
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
    it('should have correct default configuration', () => {
      const middleware = defaultRateLimiter.middleware();

      // Should allow 100 requests
      for (let i = 0; i < 100; i++) {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }

      expect(mockNext).toHaveBeenCalledTimes(100);
      expect(mockRes.status).not.toHaveBeenCalledWith(429);

      // 101st request should be blocked
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(429);
    });
  });

  describe('strictRateLimiter', () => {
    it('should have correct strict configuration', () => {
      const middleware = strictRateLimiter.middleware();

      // Should allow 10 requests
      for (let i = 0; i < 10; i++) {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }

      expect(mockNext).toHaveBeenCalledTimes(10);
      expect(mockRes.status).not.toHaveBeenCalledWith(429);

      // 11th request should be blocked
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(429);
    });
  });

  describe('Edge cases', () => {
    it('should handle count decrement when count would go below 0', () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        skipSuccessfulRequests: true,
      });

      const middleware = limiter.middleware();
      let wrappedSend: any;

      // Make one request
      mockRes.statusCode = 200;
      middleware(mockReq as Request, mockRes as Response, mockNext);
      wrappedSend = mockRes.send;
      wrappedSend('response body'); // Simulate successful response

      // Should still work
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(2);
    });

    it('should handle different HTTP methods in endpoint key', () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2,
      });

      const middleware = limiter.middleware();

      // GET requests
      const getReq = { ...mockReq, method: 'GET', path: '/test' };
      middleware(getReq as Request, mockRes as Response, mockNext);
      middleware(getReq as Request, mockRes as Response, mockNext);
      middleware(getReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(429);

      // Reset mock
      (mockRes.status as jest.Mock).mockClear();
      (mockNext as jest.Mock).mockClear();

      // POST requests to same path should have separate limit
      const postReq = { ...mockReq, method: 'POST', path: '/test' };
      middleware(postReq as Request, mockRes as Response, mockNext);
      middleware(postReq as Request, mockRes as Response, mockNext);
      middleware(postReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(429);
    });
  });
});

