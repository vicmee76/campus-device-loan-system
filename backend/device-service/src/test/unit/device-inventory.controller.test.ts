/// <reference types="jest" />

import { Request, Response } from 'express';
import { DeviceInventoryController } from '../../api/controller/device-inventory.controller';
import deviceInventoryService from '../../api/services/device-inventory.service';
import { getStatusCode } from '../../api/utils/controller.utils';

jest.mock('../../api/services/device-inventory.service');
jest.mock('../../api/utils/controller.utils');

describe('DeviceInventoryController - Unit Tests', () => {
  let controller: DeviceInventoryController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  const mockDeviceInventoryService = deviceInventoryService as jest.Mocked<typeof deviceInventoryService>;
  const mockGetStatusCode = getStatusCode as jest.MockedFunction<typeof getStatusCode>;

  beforeEach(() => {
    controller = new DeviceInventoryController();
    jest.clearAllMocks();

    mockRequest = {
      params: {},
      query: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockGetStatusCode.mockReturnValue(200);
  });

  describe('getDeviceInventoryByDeviceId', () => {
    it('should return inventory for device', async () => {
      const deviceId = 'device-123';
      mockRequest.params = { deviceId };

      const mockResult = {
        success: true,
        code: '00' as const,
        data: [{
          inventoryId: 'inv-1',
          deviceId,
          serialNumber: 'SN123',
          isAvailable: true,
          createdAt: new Date(),
          device: {
            deviceId,
            brand: 'Apple',
            model: 'MacBook',
            category: 'Laptop',
            description: 'Test device',
            defaultLoanDurationDays: 7,
            createdAt: new Date(),
            isDeleted: false,
          },
        }],
        message: 'Success',
      };

      mockDeviceInventoryService.getDeviceInventoryByDeviceId.mockResolvedValue(mockResult);

      await controller.getDeviceInventoryByDeviceId(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockDeviceInventoryService.getDeviceInventoryByDeviceId).toHaveBeenCalledWith(deviceId);
      expect(mockGetStatusCode).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('getAllInventory', () => {
    it('should return all inventory with default pagination', async () => {
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

      mockDeviceInventoryService.getAllInventory.mockResolvedValue(mockResult);

      await controller.getAllInventory(mockRequest as Request, mockResponse as Response);

      expect(mockDeviceInventoryService.getAllInventory).toHaveBeenCalledWith({
        deviceId: undefined,
        serialNumber: undefined,
        page: 1,
        pageSize: 10,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle custom pagination parameters', async () => {
      mockRequest.query = {
        page: '2',
        pageSize: '20',
      };

      const mockResult = {
        success: true,
        code: '00' as const,
        data: {
          pagination: {
            page: 2,
            pageSize: 20,
            totalCount: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
          data: [],
        },
        message: 'Success',
      };

      mockDeviceInventoryService.getAllInventory.mockResolvedValue(mockResult);

      await controller.getAllInventory(mockRequest as Request, mockResponse as Response);

      expect(mockDeviceInventoryService.getAllInventory).toHaveBeenCalledWith({
        deviceId: undefined,
        serialNumber: undefined,
        page: 2,
        pageSize: 20,
      });
    });

    it('should handle deviceId filter', async () => {
      mockRequest.query = {
        deviceId: 'device-123',
      };

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

      mockDeviceInventoryService.getAllInventory.mockResolvedValue(mockResult);

      await controller.getAllInventory(mockRequest as Request, mockResponse as Response);

      expect(mockDeviceInventoryService.getAllInventory).toHaveBeenCalledWith({
        deviceId: 'device-123',
        serialNumber: undefined,
        page: 1,
        pageSize: 10,
      });
    });

    it('should handle serialNumber filter', async () => {
      mockRequest.query = {
        serialNumber: 'SN123456',
      };

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

      mockDeviceInventoryService.getAllInventory.mockResolvedValue(mockResult);

      await controller.getAllInventory(mockRequest as Request, mockResponse as Response);

      expect(mockDeviceInventoryService.getAllInventory).toHaveBeenCalledWith({
        deviceId: undefined,
        serialNumber: 'SN123456',
        page: 1,
        pageSize: 10,
      });
    });
  });

  describe('getInventoryById', () => {
    it('should return inventory by id', async () => {
      const inventoryId = 'inventory-123';
      mockRequest.params = { id: inventoryId };

      const mockResult = {
        success: true,
        code: '00' as const,
        data: {
          inventoryId,
          deviceId: 'device-123',
          serialNumber: 'SN123',
          isAvailable: true,
          createdAt: new Date(),
          device: {
            deviceId: 'device-123',
            brand: 'Apple',
            model: 'MacBook',
            category: 'Laptop',
            description: 'Test device',
            defaultLoanDurationDays: 7,
            createdAt: new Date(),
            isDeleted: false,
          },
        },
        message: 'Success',
      };

      mockDeviceInventoryService.getInventoryById.mockResolvedValue(mockResult);

      await controller.getInventoryById(mockRequest as Request, mockResponse as Response);

      expect(mockDeviceInventoryService.getInventoryById).toHaveBeenCalledWith(inventoryId);
      expect(mockGetStatusCode).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });
});

