import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

export class RateLimiter {
  private store: RateLimitStore = {};

  constructor(private options: RateLimitOptions) {
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const key = this.getKey(req);
      const now = Date.now();
      const record = this.store[key];

      // Initialize or reset if window expired
      if (!record || now > record.resetTime) {
        this.store[key] = {
          count: 1,
          resetTime: now + this.options.windowMs,
        };
        return next();
      }

      // Check if limit already exceeded before incrementing
      if (record.count >= this.options.maxRequests) {
        const retryAfter = Math.ceil((record.resetTime - now) / 1000);
        logger.warn('Rate limit exceeded', {
          key,
          count: record.count,
          maxRequests: this.options.maxRequests,
          retryAfter,
        });

        res.setHeader('Retry-After', retryAfter.toString());
        res.status(429).json({
          success: false,
          code: '09',
          message: 'Too many requests. Please try again later.',
          data: null,
        });
        return;
      }

      // Increment count only if within limit
      record.count++;

      // Track response status if needed
      if (this.options.skipSuccessfulRequests || this.options.skipFailedRequests) {
        const originalSend = res.send.bind(res);
        const limiter = this;
        res.send = function (body: any) {
          const statusCode = res.statusCode;
          const isSuccess = statusCode >= 200 && statusCode < 300;
          const isFailure = statusCode >= 400;

          if (
            (limiter.options.skipSuccessfulRequests && isSuccess) ||
            (limiter.options.skipFailedRequests && isFailure)
          ) {
            const record = limiter.store[key];
            if (record) {
              record.count = Math.max(0, record.count - 1);
            }
          }

          return originalSend(body);
        };
      }

      next();
    };
  }

  private getKey(req: Request): string {
    if (this.options.keyGenerator) {
      return this.options.keyGenerator(req);
    }

    // Include endpoint (method + path) in the key for per-endpoint rate limiting
    const endpoint = `${req.method}:${req.path}`;
    
    // Default: use user ID if authenticated, otherwise IP address
    const userId = (req as any).user?.userId;
    if (userId) {
      return `user:${userId}:${endpoint}`;
    }

    // Try to get IP from various sources (handles proxy scenarios)
    const ip = req.ip || 
               (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
               (req.headers['x-real-ip'] as string) ||
               req.socket.remoteAddress ||
               'unknown';
    
    return `ip:${ip}:${endpoint}`;
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach((key) => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  reset(key: string): void {
    delete this.store[key];
  }
}

// Pre-configured rate limiters
export const createRateLimiter = (options: RateLimitOptions) => {
  return new RateLimiter(options);
};

// Common rate limiters
// Per-endpoint rate limiting: limits rapid requests to the same endpoint
export const defaultRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 100, // 100 requests per minute per endpoint (prevents rapid/constant requests)
});

export const strictRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute per endpoint
});

