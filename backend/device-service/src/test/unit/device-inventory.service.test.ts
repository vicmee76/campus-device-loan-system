import { DeviceInventoryService } from '../../api/services/device-inventory.service';
import deviceInventoryRepository from '../../api/repository/device-inventory.repository';
import { DeviceInventoryDto, DeviceInventoryWithDeviceDto } from '../../api/dtos/device-inventory.dto';

// Mock dependencies
jest.mock('../../api/repository/device-inventory.repository');

describe('DeviceInventoryService - Unit Tests', () => {
  let deviceInventoryService: DeviceInventoryService;
  const mockDeviceInventoryRepository = deviceInventoryRepository as jest.Mocked<typeof deviceInventoryRepository>;

  beforeEach(() => {
    deviceInventoryService = new DeviceInventoryService();
    jest.clearAllMocks();
  });

  describe('getDeviceInventoryByDeviceId', () => {
    const mockDeviceId = 'device-123';

    it('should return inventory with device details', async () => {
      const mockResults = [
        {
          inventory_id: 'inv-1',
          device_id: mockDeviceId,
          serial_number: 'SN001',
          is_available: true,
          created_at: new Date(),
          device_device_id: mockDeviceId,
          brand: 'Apple',
          model: 'MacBook Pro',
          category: 'Laptop',
          description: null,
          default_loan_duration_days: 2,
          device_created_at: new Date(),
          is_deleted: false,
        },
      ];

      mockDeviceInventoryRepository.findByDeviceId.mockResolvedValue(mockResults);

      const result = await deviceInventoryService.getDeviceInventoryByDeviceId(mockDeviceId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(mockDeviceInventoryRepository.findByDeviceId).toHaveBeenCalledWith(mockDeviceId);
    });

    it('should return validation error when deviceId is missing', async () => {
      const result = await deviceInventoryService.getDeviceInventoryByDeviceId('');

      expect(result.success).toBe(false);
      expect(result.code).toBe('09');
      expect(mockDeviceInventoryRepository.findByDeviceId).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockDeviceInventoryRepository.findByDeviceId.mockRejectedValue(new Error('Database error'));

      const result = await deviceInventoryService.getDeviceInventoryByDeviceId(mockDeviceId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('06');
    });
  });

  describe('getAllInventory', () => {
    const mockInventory: DeviceInventoryDto[] = [
      {
        inventoryId: 'inv-1',
        deviceId: 'device-1',
        serialNumber: 'SN001',
        isAvailable: true,
        createdAt: new Date(),
      },
    ];

    it('should return paginated inventory', async () => {
      const mockResult = {
        data: mockInventory,
        pagination: {
          page: 1,
          pageSize: 10,
          totalCount: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      mockDeviceInventoryRepository.findAll.mockResolvedValue(mockResult);

      const result = await deviceInventoryService.getAllInventory({ page: 1, pageSize: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(mockDeviceInventoryRepository.findAll).toHaveBeenCalledWith({ page: 1, pageSize: 10 });
    });

    it('should handle errors gracefully', async () => {
      mockDeviceInventoryRepository.findAll.mockRejectedValue(new Error('Database error'));

      const result = await deviceInventoryService.getAllInventory();

      expect(result.success).toBe(false);
      expect(result.code).toBe('06');
    });
  });

  describe('getInventoryById', () => {
    const mockInventoryId = 'inventory-123';

    it('should return inventory with device details', async () => {
      const mockResult = {
        inventory_id: mockInventoryId,
        device_id: 'device-123',
        serial_number: 'SN001',
        is_available: true,
        created_at: new Date(),
        device_device_id: 'device-123',
        brand: 'Apple',
        model: 'MacBook Pro',
        category: 'Laptop',
        description: null,
        default_loan_duration_days: 2,
        device_created_at: new Date(),
        is_deleted: false,
      };

      mockDeviceInventoryRepository.findById.mockResolvedValue(mockResult);

      const result = await deviceInventoryService.getInventoryById(mockInventoryId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockDeviceInventoryRepository.findById).toHaveBeenCalledWith(mockInventoryId);
    });

    it('should return not found when inventory does not exist', async () => {
      mockDeviceInventoryRepository.findById.mockResolvedValue(null);

      const result = await deviceInventoryService.getInventoryById(mockInventoryId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('05');
    });

    it('should return validation error when inventoryId is missing', async () => {
      const result = await deviceInventoryService.getInventoryById('');

      expect(result.success).toBe(false);
      expect(result.code).toBe('09');
      expect(mockDeviceInventoryRepository.findById).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockDeviceInventoryRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await deviceInventoryService.getInventoryById(mockInventoryId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('06');
    });
  });
});

