import request from 'supertest';
import app from '../../device-app';
import deviceRepository from '../../api/repository/device.repository';
import { DeviceDto, DeviceWithInventoryDto } from '../../api/dtos/device.dto';
import { verifyToken } from '../../api/utils/jwt.utils';

// Mock repositories
jest.mock('../../api/repository/device.repository');

describe('Device API - Integration Tests', () => {
  const mockDeviceRepository = deviceRepository as jest.Mocked<typeof deviceRepository>;
  const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;

  const mockDevices: DeviceDto[] = [
    {
      deviceId: 'device-1',
      brand: 'Apple',
      model: 'MacBook Pro',
      category: 'Laptop',
      description: 'High-performance laptop',
      defaultLoanDurationDays: 2,
      createdAt: new Date(),
      isDeleted: false,
    },
    {
      deviceId: 'device-2',
      brand: 'Dell',
      model: 'XPS 13',
      category: 'Laptop',
      description: 'Ultrabook',
      defaultLoanDurationDays: 2,
      createdAt: new Date(),
      isDeleted: false,
    },
  ];

  const mockDevicesWithInventory: DeviceWithInventoryDto[] = [
    {
      deviceId: 'device-1',
      brand: 'Apple',
      model: 'MacBook Pro',
      category: 'Laptop',
      description: 'High-performance laptop',
      totalUnits: 5,
      availableUnits: 3,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /v1/api/devices/get-all-devices', () => {
    it('should return all devices without authentication', async () => {
      mockDeviceRepository.findAll.mockResolvedValue({
        data: mockDevices,
        pagination: {
          page: 1,
          pageSize: 10,
          totalCount: 2,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      const response = await request(app)
        .get('/v1/api/devices/get-all-devices')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toBeDefined();
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.data.length).toBe(2);
      expect(response.body.data.data[0].brand).toBe('Apple');
    });

    it('should support pagination', async () => {
      mockDeviceRepository.findAll.mockResolvedValue({
        data: [mockDevices[0]],
        pagination: {
          page: 1,
          pageSize: 1,
          totalCount: 2,
          totalPages: 2,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      });

      const response = await request(app)
        .get('/v1/api/devices/get-all-devices?page=1&pageSize=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.pageSize).toBe(1);
      expect(response.body.data.pagination.totalCount).toBe(2);
      expect(response.body.data.pagination.hasNextPage).toBe(true);
    });

    it('should support search parameter', async () => {
      mockDeviceRepository.findAll.mockResolvedValue({
        data: [mockDevices[0]],
        pagination: {
          page: 1,
          pageSize: 10,
          totalCount: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      const response = await request(app)
        .get('/v1/api/devices/get-all-devices?search=Apple')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data.length).toBe(1);
      expect(mockDeviceRepository.findAll).toHaveBeenCalledWith({
        search: 'Apple',
        page: 1,
        pageSize: 10,
      });
    });

    it('should return empty array when no devices found', async () => {
      mockDeviceRepository.findAll.mockResolvedValue({
        data: [],
        pagination: {
          page: 1,
          pageSize: 10,
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      const response = await request(app)
        .get('/v1/api/devices/get-all-devices')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toEqual([]);
      expect(response.body.data.pagination.totalCount).toBe(0);
    });
  });

  describe('GET /v1/api/devices/get-device-by-id/:id', () => {
    it('should return device by id', async () => {
      mockDeviceRepository.findById.mockResolvedValue(mockDevices[0]);

      const response = await request(app)
        .get('/v1/api/devices/get-device-by-id/device-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deviceId).toBe('device-1');
      expect(response.body.data.brand).toBe('Apple');
      expect(response.body.data.model).toBe('MacBook Pro');
      expect(mockDeviceRepository.findById).toHaveBeenCalledWith('device-1');
    });

    it('should return 404 when device not found', async () => {
      mockDeviceRepository.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/v1/api/devices/get-device-by-id/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('05');
      expect(response.body.data).toBeNull();
    });

    it('should return validation error when id is missing', async () => {
      const response = await request(app)
        .get('/v1/api/devices/get-device-by-id/')
        .expect(404);
    });
  });

  describe('GET /v1/api/devices/available-devices', () => {
    const mockStudentUser = {
      userId: 'student-123',
      email: 'student@example.com',
      role: 'student' as const,
    };

    beforeEach(() => {
      mockVerifyToken.mockReturnValue(mockStudentUser);
    });

    it('should return available devices with inventory counts when authenticated as student', async () => {
      mockDeviceRepository.availableDevices.mockResolvedValue({
        data: mockDevicesWithInventory,
        pagination: {
          page: 1,
          pageSize: 10,
          totalCount: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      const response = await request(app)
        .get('/v1/api/devices/available-devices')
        .set('Authorization', 'Bearer valid-student-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toBeDefined();
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.data[0].totalUnits).toBe(5);
      expect(response.body.data.data[0].availableUnits).toBe(3);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .get('/v1/api/devices/available-devices')
        .expect(401);
    });

    it('should support pagination', async () => {
      mockDeviceRepository.availableDevices.mockResolvedValue({
        data: mockDevicesWithInventory,
        pagination: {
          page: 1,
          pageSize: 5,
          totalCount: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      const response = await request(app)
        .get('/v1/api/devices/available-devices?page=1&pageSize=5')
        .set('Authorization', 'Bearer valid-student-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.pageSize).toBe(5);
    });

    it('should support search parameter', async () => {
      mockDeviceRepository.availableDevices.mockResolvedValue({
        data: mockDevicesWithInventory,
        pagination: {
          page: 1,
          pageSize: 10,
          totalCount: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      const response = await request(app)
        .get('/v1/api/devices/available-devices?search=Apple')
        .set('Authorization', 'Bearer valid-student-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockDeviceRepository.availableDevices).toHaveBeenCalledWith({
        search: 'Apple',
        page: 1,
        pageSize: 10,
      });
    });

    it('should return empty array when no devices available', async () => {
      mockDeviceRepository.availableDevices.mockResolvedValue({
        data: [],
        pagination: {
          page: 1,
          pageSize: 10,
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      const response = await request(app)
        .get('/v1/api/devices/available-devices')
        .set('Authorization', 'Bearer valid-student-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toEqual([]);
      expect(response.body.data.pagination.totalCount).toBe(0);
    });
  });
});

