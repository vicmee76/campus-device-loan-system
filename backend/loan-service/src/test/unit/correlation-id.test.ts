/// <reference types="jest" />

import { Request, Response, NextFunction } from 'express';
import { correlationIdMiddleware, getCorrelationId } from '../../api/utils/correlation-id';

describe('Correlation ID - Unit Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      setHeader: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('correlationIdMiddleware', () => {
    it('should use existing correlation ID from header', () => {
      const existingCorrelationId = 'existing-correlation-id-123';
      mockRequest.headers = {
        'x-correlation-id': existingCorrelationId,
      };

      correlationIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.correlationId).toBe(existingCorrelationId);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Correlation-ID', existingCorrelationId);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should generate new correlation ID when header is missing', () => {
      mockRequest.headers = {};

      correlationIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.correlationId).toBeDefined();
      expect(typeof mockRequest.correlationId).toBe('string');
      expect(mockRequest.correlationId!.length).toBeGreaterThan(0);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Correlation-ID', mockRequest.correlationId);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should generate UUID format correlation ID', () => {
      mockRequest.headers = {};

      correlationIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 characters)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(mockRequest.correlationId).toMatch(uuidRegex);
    });
  });

  describe('getCorrelationId', () => {
    it('should return correlation ID when present', () => {
      const correlationId = 'test-correlation-id';
      mockRequest.correlationId = correlationId;

      const result = getCorrelationId(mockRequest as Request);

      expect(result).toBe(correlationId);
    });

    it('should return undefined when correlation ID is not present', () => {
      mockRequest.correlationId = undefined;

      const result = getCorrelationId(mockRequest as Request);

      expect(result).toBeUndefined();
    });
  });
});

