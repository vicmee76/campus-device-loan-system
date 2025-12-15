import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from './jwt.utils';
import { ResponseHelper } from '../dtos/response.dto';
import { logger } from './logger';

/**
 * Authentication Middleware
 * 
 * Validates JWT tokens issued by the Device Service.
 * Tokens are verified locally using the shared JWT_SECRET.
 * Tokens should be provided in the Authorization header as: Bearer <token>
 */

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      logger.warn('Authentication failed: No authorization header');
      res.status(401).json(ResponseHelper.error('Authorization header is required'));
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      logger.warn('Authentication failed: Invalid authorization header format', { authHeader: authHeader.substring(0, 20) + '...' });
      res.status(401).json(ResponseHelper.error('Invalid authorization header format. Use: Bearer <token>'));
      return;
    }

    const token = parts[1];

    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      logger.debug('Authentication successful', { userId: decoded.userId, email: decoded.email });
      next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid or expired token';
      logger.warn('Token verification failed', { error: errorMessage });
      res.status(401).json(ResponseHelper.error(errorMessage));
      return;
    }
  } catch (error) {
    logger.error('Authentication middleware error', error);
    res.status(401).json(ResponseHelper.error('Authentication failed'));
    return;
  }
};

export const requireStaff = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    logger.warn('Authorization failed: User not authenticated');
    res.status(401).json(ResponseHelper.error('Authentication required'));
    return;
  }

  if (req.user.role !== 'staff') {
    logger.warn('Authorization failed: Staff role required', { userId: req.user.userId, role: req.user.role });
    res.status(403).json(ResponseHelper.error('Access denied. Staff role required'));
    return;
  }

  logger.debug('Staff authorization successful', { userId: req.user.userId, email: req.user.email });
  next();
};

export const requireStudent = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    logger.warn('Authorization failed: User not authenticated');
    res.status(401).json(ResponseHelper.error('Authentication required'));
    return;
  }

  if (req.user.role !== 'student') {
    logger.warn('Authorization failed: Student role required', { userId: req.user.userId, role: req.user.role });
    res.status(403).json(ResponseHelper.error('Access denied. Student role required'));
    return;
  }

  logger.debug('Student authorization successful', { userId: req.user.userId, email: req.user.email });
  next();
};
