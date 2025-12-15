/// <reference types="jest" />

import { Request, Response, NextFunction } from 'express';
import { authenticate, requireStaff, requireStudent, AuthenticatedRequest } from '../../api/utils/auth.middleware';
import { verifyToken } from '../../api/utils/jwt.utils';
import { ResponseHelper } from '../../api/dtos/response.dto';
import { logger } from '../../api/utils/logger';

jest.mock('../../api/utils/jwt.utils');
jest.mock('../../api/dtos/response.dto');
jest.mock('../../api/utils/logger');

describe('Auth Middleware - Unit Tests', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('authenticate', () => {
    it('should call next() when token is valid', () => {
      const token = 'valid-token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      const mockDecoded = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'student' as const,
      };

      mockVerifyToken.mockReturnValue(mockDecoded);

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockVerifyToken).toHaveBeenCalledWith(token);
      expect(mockRequest.user).toEqual(mockDecoded);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header is missing', () => {
      mockRequest.headers = {};

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith('Authentication failed: No authorization header');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header format is invalid', () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token',
      };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        'Authentication failed: Invalid authorization header format',
        expect.any(Object)
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when Bearer prefix is missing', () => {
      mockRequest.headers = {
        authorization: 'token-without-bearer',
      };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token verification fails', () => {
      const token = 'invalid-token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      const error = new Error('Token expired');
      mockVerifyToken.mockImplementation(() => {
        throw error;
      });

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(logger.warn).toHaveBeenCalledWith('Token verification failed', {
        error: 'Token expired',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle non-Error exceptions', () => {
      const token = 'invalid-token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockVerifyToken.mockImplementation(() => {
        throw 'String error';
      });

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle middleware errors', () => {
      mockRequest.headers = null as any;

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(logger.error).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireStaff', () => {
    it('should call next() when user is staff', () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'staff@example.com',
        role: 'staff',
      };

      requireStaff(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith('Staff authorization successful', {
        userId: 'user-123',
        email: 'staff@example.com',
      });
    });

    it('should return 401 when user is not authenticated', () => {
      mockRequest.user = undefined;

      requireStaff(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(logger.warn).toHaveBeenCalledWith('Authorization failed: User not authenticated');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not staff', () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'student@example.com',
        role: 'student',
      };

      requireStaff(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(logger.warn).toHaveBeenCalledWith('Authorization failed: Staff role required', {
        userId: 'user-123',
        role: 'student',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireStudent', () => {
    it('should call next() when user is student', () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'student@example.com',
        role: 'student',
      };

      requireStudent(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith('Student authorization successful', {
        userId: 'user-123',
        email: 'student@example.com',
      });
    });

    it('should return 401 when user is not authenticated', () => {
      mockRequest.user = undefined;

      requireStudent(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(logger.warn).toHaveBeenCalledWith('Authorization failed: User not authenticated');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not student', () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'staff@example.com',
        role: 'staff',
      };

      requireStudent(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(logger.warn).toHaveBeenCalledWith('Authorization failed: Student role required', {
        userId: 'user-123',
        role: 'staff',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

