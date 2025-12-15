/// <reference types="jest" />

import { Request, Response, NextFunction } from 'express';
import { authenticate, requireStaff, requireStudent, AuthenticatedRequest } from '../../api/utils/auth.middleware';
import { verifyToken } from '../../api/utils/jwt.utils';

jest.mock('../../api/utils/jwt.utils');
jest.mock('../../api/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Auth Middleware - Unit Tests', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

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
    it('should authenticate successfully with valid Bearer token', () => {
      const mockPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'student' as const,
      };

      (verifyToken as jest.Mock).mockReturnValue(mockPayload);
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(verifyToken).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when authorization header is missing', () => {
      mockRequest.headers = {};

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Authorization header is required',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header format is invalid - missing Bearer', () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token',
      };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid authorization header format. Use: Bearer <token>',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header format is invalid - wrong number of parts', () => {
      mockRequest.headers = {
        authorization: 'Bearer token extra',
      };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid authorization header format. Use: Bearer <token>',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token verification fails', () => {
      const error = new Error('Token has expired');
      (verifyToken as jest.Mock).mockImplementation(() => {
        throw error;
      });
      mockRequest.headers = {
        authorization: 'Bearer expired-token',
      };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Token has expired',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token verification throws non-Error', () => {
      (verifyToken as jest.Mock).mockImplementation(() => {
        throw 'String error';
      });
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid or expired token',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle unexpected errors in middleware', () => {
      mockRequest.headers = null as any;

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Authentication failed',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireStaff', () => {
    it('should allow access when user has staff role', () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'staff@example.com',
        role: 'staff',
      };

      requireStaff(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      mockRequest.user = undefined;

      requireStaff(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Authentication required',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user does not have staff role', () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'student@example.com',
        role: 'student',
      };

      requireStaff(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Access denied. Staff role required',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireStudent', () => {
    it('should allow access when user has student role', () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'student@example.com',
        role: 'student',
      };

      requireStudent(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      mockRequest.user = undefined;

      requireStudent(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Authentication required',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user does not have student role', () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'staff@example.com',
        role: 'staff',
      };

      requireStudent(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Access denied. Student role required',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

