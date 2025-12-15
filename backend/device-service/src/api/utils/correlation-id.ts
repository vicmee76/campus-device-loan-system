import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Extend Express Request to include correlationId
declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Get correlation ID from header or generate new one using Node.js built-in crypto
  const correlationId = req.headers['x-correlation-id'] as string || randomUUID();
  
  // Attach to request
  req.correlationId = correlationId;
  
  // Add to response header
  res.setHeader('X-Correlation-ID', correlationId);
  
  next();
};

export const getCorrelationId = (req: Request): string | undefined => {
  return req.correlationId;
};

