/// <reference types="jest" />

import { Request, Response } from 'express';
import { WaitlistController } from '../../api/controller/waitlist.controller';
import waitlistService from '../../api/services/waitlist.service';
import { getStatusCode } from '../../api/utils/controller.utils';
import { AuthenticatedRequest } from '../../api/utils/auth.middleware';

jest.mock('../../api/services/waitlist.service');
jest.mock('../../api/utils/controller.utils');

describe('WaitlistController - Unit Tests', () => {
  let controller: WaitlistController;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  const mockWaitlistService = waitlistService as jest.Mocked<typeof waitlistService>;
  const mockGetStatusCode = getStatusCode as jest.MockedFunction<typeof getStatusCode>;

  beforeEach(() => {
    controller = new WaitlistController();
    jest.clearAllMocks();

    mockRequest = {
      params: {},
      query: {},
      user: {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'student',
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockGetStatusCode.mockReturnValue(200);
  });

  describe('joinWaitlist', () => {
    it('should join waitlist successfully', async () => {
      const deviceId = 'device-123';
      mockRequest.params = { deviceId };

      const mockResult = {
        success: true,
        code: '00' as const,
        data: {
          waitlistId: 'waitlist-123',
          userId: 'user-123',
          deviceId,
          addedAt: new Date(),
          position: 1,
        },
        message: 'Success',
      };

      mockWaitlistService.joinWaitlist.mockResolvedValue(mockResult);

      await controller.joinWaitlist(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockWaitlistService.joinWaitlist).toHaveBeenCalledWith('user-123', deviceId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('removeFromWaitlist', () => {
    it('should remove from waitlist successfully', async () => {
      const deviceId = 'device-123';
      mockRequest.params = { deviceId };

      const mockResult = {
        success: true,
        code: '00' as const,
        data: null,
        message: 'Removed from waitlist',
      };

      mockWaitlistService.removeFromWaitlist.mockResolvedValue(mockResult);

      await controller.removeFromWaitlist(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockWaitlistService.removeFromWaitlist).toHaveBeenCalledWith('user-123', deviceId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('getAllWaitlist', () => {
    it('should get all waitlist with default pagination', async () => {
      mockRequest.query = {};

      const mockResult = {
        success: true,
        code: '00' as const,
        data: {
          pagination: {
            page: 1,
            pageSize: 10,
            totalCount: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
          data: [],
        },
        message: 'Success',
      };

      mockWaitlistService.getAllWaitlist.mockResolvedValue(mockResult);

      await controller.getAllWaitlist(mockRequest as Request, mockResponse as Response);

      expect(mockWaitlistService.getAllWaitlist).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle custom pagination', async () => {
      mockRequest.query = {
        page: '2',
        pageSize: '25',
      };

      const mockResult = {
        success: true,
        code: '00' as const,
        data: {
          pagination: {
            page: 2,
            pageSize: 25,
            totalCount: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
          data: [],
        },
        message: 'Success',
      };

      mockWaitlistService.getAllWaitlist.mockResolvedValue(mockResult);

      await controller.getAllWaitlist(mockRequest as Request, mockResponse as Response);

      expect(mockWaitlistService.getAllWaitlist).toHaveBeenCalledWith({
        page: 2,
        pageSize: 25,
      });
    });
  });

  describe('getWaitlistByUserId', () => {
    it('should get waitlist by user ID', async () => {
      const userId = 'user-456';
      mockRequest.params = { userId };

      const mockResult = {
        success: true,
        code: '00' as const,
        data: [{
          waitlistId: 'waitlist-1',
          userId,
          deviceId: 'device-123',
          addedAt: new Date(),
          isNotified: false,
          notifiedAt: null,
          user: {
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'student' as const,
          },
          device: {
            brand: 'Apple',
            model: 'MacBook',
            category: 'Laptop',
          },
        }],
        message: 'Success',
      };

      mockWaitlistService.getWaitlistByUserId.mockResolvedValue(mockResult);

      await controller.getWaitlistByUserId(mockRequest as Request, mockResponse as Response);

      expect(mockWaitlistService.getWaitlistByUserId).toHaveBeenCalledWith(userId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('getWaitlistByDeviceId', () => {
    it('should get waitlist by device ID', async () => {
      const deviceId = 'device-123';
      mockRequest.params = { deviceId };

      const mockResult = {
        success: true,
        code: '00' as const,
        data: [{
          waitlistId: 'waitlist-1',
          userId: 'user-123',
          deviceId,
          addedAt: new Date(),
          isNotified: false,
          notifiedAt: null,
          user: {
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'student' as const,
          },
          device: {
            brand: 'Apple',
            model: 'MacBook',
            category: 'Laptop',
          },
        }],
        message: 'Success',
      };

      mockWaitlistService.getWaitlistByDeviceId.mockResolvedValue(mockResult);

      await controller.getWaitlistByDeviceId(mockRequest as Request, mockResponse as Response);

      expect(mockWaitlistService.getWaitlistByDeviceId).toHaveBeenCalledWith(deviceId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('getMyWaitlist', () => {
    it('should get current user waitlist', async () => {
      const mockResult = {
        success: true,
        code: '00' as const,
        data: [{
          waitlistId: 'waitlist-1',
          userId: 'user-123',
          deviceId: 'device-123',
          addedAt: new Date(),
          isNotified: false,
          notifiedAt: null,
          user: {
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'student' as const,
          },
          device: {
            brand: 'Apple',
            model: 'MacBook',
            category: 'Laptop',
          },
        }],
        message: 'Success',
      };

      mockWaitlistService.getMyWaitlist.mockResolvedValue(mockResult);

      await controller.getMyWaitlist(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockWaitlistService.getMyWaitlist).toHaveBeenCalledWith('user-123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });
  });
});

