import { DeviceService } from '../../api/services/device.service';
import deviceRepository from '../../api/repository/device.repository';
import { DeviceDto, DeviceWithInventoryDto } from '../../api/dtos/device.dto';

// Mock dependencies
jest.mock('../../api/repository/device.repository');

describe('DeviceService - Unit Tests', () => {
  let deviceService: DeviceService;
  const mockDeviceRepository = deviceRepository as jest.Mocked<typeof deviceRepository>;

  beforeEach(() => {
    deviceService = new DeviceService();
    jest.clearAllMocks();
  });

  describe('getDeviceById', () => {
    const mockDeviceId = 'device-123';
    const mockDevice: DeviceDto = {
      deviceId: mockDeviceId,
      brand: 'Apple',
      model: 'MacBook Pro',
      category: 'Laptop',
      description: 'Test device',
      defaultLoanDurationDays: 2,
      createdAt: new Date(),
      isDeleted: false,
    };

    it('should return device when found', async () => {
      mockDeviceRepository.findById.mockResolvedValue(mockDevice);

      const result = await deviceService.getDeviceById(mockDeviceId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDevice);
      expect(mockDeviceRepository.findById).toHaveBeenCalledWith(mockDeviceId);
    });

    it('should return not found when device does not exist', async () => {
      mockDeviceRepository.findById.mockResolvedValue(null);

      const result = await deviceService.getDeviceById(mockDeviceId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('05');
      expect(result.data).toBeNull();
    });

    it('should return validation error when deviceId is empty', async () => {
      const result = await deviceService.getDeviceById('');

      expect(result.success).toBe(false);
      expect(result.code).toBe('09');
      expect(mockDeviceRepository.findById).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockDeviceRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await deviceService.getDeviceById(mockDeviceId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('06');
    });
  });

  describe('getAllDevices', () => {
    const mockDevices: DeviceDto[] = [
      {
        deviceId: 'device-1',
        brand: 'Apple',
        model: 'MacBook Pro',
        category: 'Laptop',
        description: null,
        defaultLoanDurationDays: 2,
        createdAt: new Date(),
        isDeleted: false,
      },
    ];

    it('should return paginated devices', async () => {
      const mockResult = {
        data: mockDevices,
        pagination: {
          page: 1,
          pageSize: 10,
          totalCount: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      mockDeviceRepository.findAll.mockResolvedValue(mockResult);

      const result = await deviceService.getAllDevices({ page: 1, pageSize: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(mockDeviceRepository.findAll).toHaveBeenCalledWith({ page: 1, pageSize: 10 });
    });

    it('should handle search parameter', async () => {
      const mockResult = {
        data: mockDevices,
        pagination: {
          page: 1,
          pageSize: 10,
          totalCount: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      mockDeviceRepository.findAll.mockResolvedValue(mockResult);

      const result = await deviceService.getAllDevices({ search: 'Apple', page: 1, pageSize: 10 });

      expect(result.success).toBe(true);
      expect(mockDeviceRepository.findAll).toHaveBeenCalledWith({ search: 'Apple', page: 1, pageSize: 10 });
    });

    it('should handle errors gracefully', async () => {
      mockDeviceRepository.findAll.mockRejectedValue(new Error('Database error'));

      const result = await deviceService.getAllDevices();

      expect(result.success).toBe(false);
      expect(result.code).toBe('06');
    });
  });

  describe('availableDevices', () => {
    const mockDevicesWithInventory: DeviceWithInventoryDto[] = [
      {
        deviceId: 'device-1',
        brand: 'Apple',
        model: 'MacBook Pro',
        category: 'Laptop',
        description: null,
        totalUnits: 5,
        availableUnits: 3,
      },
    ];

    it('should return devices with inventory counts', async () => {
      const mockResult = {
        data: mockDevicesWithInventory,
        pagination: {
          page: 1,
          pageSize: 10,
          totalCount: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      mockDeviceRepository.availableDevices.mockResolvedValue(mockResult);

      const result = await deviceService.availableDevices({ page: 1, pageSize: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(mockDeviceRepository.availableDevices).toHaveBeenCalledWith({ page: 1, pageSize: 10 });
    });

    it('should handle errors gracefully', async () => {
      mockDeviceRepository.availableDevices.mockRejectedValue(new Error('Database error'));

      const result = await deviceService.availableDevices();

      expect(result.success).toBe(false);
      expect(result.code).toBe('06');
    });
  });
});

