/// <reference types="jest" />

import { Request, Response } from 'express';
import healthRoutes from '../../api/routes/health.routes';
import { db } from '../../database/connection';

jest.mock('../../database/connection', () => {
  const mockRaw = jest.fn();
  return {
    db: {
      raw: mockRaw,
    },
  };
});

describe('Health Routes - Unit Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  const mockDb = db as any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {};

    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  describe('GET /health', () => {
    it('should return health status', () => {
      const route = healthRoutes.stack.find((layer) => layer.route?.path === '/health');
      expect(route).toBeDefined();

      if (route && route.route) {
        const handler = route.route.stack[0].handle;
        const mockNext = jest.fn();
        handler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.json).toHaveBeenCalledWith({ status: 'ok' });
      }
    });
  });

  describe('GET /ready', () => {
    it('should return ready status when database is reachable', async () => {
      mockDb.raw.mockResolvedValue([{ rows: [] }]);

      const route = healthRoutes.stack.find((layer) => layer.route?.path === '/ready');
      expect(route).toBeDefined();

      if (route && route.route) {
        const handler = route.route.stack[0].handle;
        const mockNext = jest.fn();
        await handler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockDb.raw).toHaveBeenCalledWith('SELECT 1');
        expect(mockResponse.json).toHaveBeenCalledWith({ ready: true });
      }
    });

    it('should return error when database is unreachable', async () => {
      const error = new Error('Connection failed');
      mockDb.raw.mockRejectedValue(error);

      const route = healthRoutes.stack.find((layer) => layer.route?.path === '/ready');
      expect(route).toBeDefined();

      if (route && route.route) {
        const handler = route.route.stack[0].handle;
        const mockNext = jest.fn();
        await handler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockDb.raw).toHaveBeenCalledWith('SELECT 1');
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          ready: false,
          error: 'Database unreachable',
        });
      }
    });
  });

  describe('GET /metrics', () => {
    it('should return metrics in Prometheus format', () => {
      const route = healthRoutes.stack.find((layer) => layer.route?.path === '/metrics');
      expect(route).toBeDefined();

      if (route && route.route) {
        const handler = route.route.stack[0].handle;
        const mockNext = jest.fn();
        handler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.set).toHaveBeenCalledWith('Content-Type', 'text/plain');
        expect(mockResponse.send).toHaveBeenCalledWith(
          expect.stringContaining('http_service_status')
        );
        expect(mockResponse.send).toHaveBeenCalledWith(
          expect.stringContaining('# HELP http_service_status')
        );
        expect(mockResponse.send).toHaveBeenCalledWith(
          expect.stringContaining('# TYPE http_service_status gauge')
        );
      }
    });
  });
});

