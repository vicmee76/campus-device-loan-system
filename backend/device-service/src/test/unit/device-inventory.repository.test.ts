/// <reference types="jest" />
import { DeviceInventoryRepository } from '../../api/repository/device-inventory.repository';
import db from '../../database/connection';
import DeviceInventoryFactory from '../../api/factory/device-inventory.factory';

jest.mock('../../database/connection');
jest.mock('../../api/factory/device-inventory.factory');

describe('DeviceInventoryRepository', () => {
  let repository: DeviceInventoryRepository;
  let mockQuery: any;
  let mockDb: jest.MockedFunction<any>;

  const createThenable = (value: any) => {
    const thenable = {
      where: jest.fn().mockReturnThis(),
      whereILike: jest.fn().mockReturnThis(),
      join: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      first: jest.fn(),
      count: jest.fn().mockReturnThis(),
      clone: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      then: jest.fn((resolve) => Promise.resolve(value).then(resolve)),
      catch: jest.fn(),
    };
    return thenable;
  };

  beforeEach(() => {
    repository = new DeviceInventoryRepository();
    mockQuery = createThenable([]);
    mockDb = db as jest.MockedFunction<any>;
    mockDb.mockReturnValue(mockQuery);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return inventory DTO', async () => {
      const createDto = {
        deviceId: 'device-123',
        serialNumber: 'SN123456',
        isAvailable: true,
      };
      const mockInventory = {
        inventory_id: 'inv-123',
        device_id: 'device-123',
        serial_number: 'SN123456',
        is_available: true,
        created_at: new Date(),
      };
      const mockInventoryDto = {
        inventoryId: 'inv-123',
        deviceId: 'device-123',
        serialNumber: 'SN123456',
        isAvailable: true,
        createdAt: new Date(),
      };

      mockQuery.insert.mockReturnThis();
      mockQuery.returning.mockResolvedValue([mockInventory]);
      (DeviceInventoryFactory.toDto as jest.Mock).mockReturnValue(mockInventoryDto);

      const result = await repository.create(createDto);

      expect(mockDb).toHaveBeenCalledWith('device_inventory');
      expect(mockQuery.insert).toHaveBeenCalledWith({
        device_id: 'device-123',
        serial_number: 'SN123456',
        is_available: true,
      });
      expect(DeviceInventoryFactory.toDto).toHaveBeenCalledWith(mockInventory);
      expect(result).toEqual(mockInventoryDto);
    });

    it('should default isAvailable to true when not provided', async () => {
      const createDto = {
        deviceId: 'device-123',
        serialNumber: 'SN123456',
      };
      const mockInventory = {
        inventory_id: 'inv-123',
        device_id: 'device-123',
        serial_number: 'SN123456',
        is_available: true,
        created_at: new Date(),
      };
      const mockInventoryDto = {
        inventoryId: 'inv-123',
        deviceId: 'device-123',
        serialNumber: 'SN123456',
        isAvailable: true,
        createdAt: new Date(),
      };

      mockQuery.insert.mockReturnThis();
      mockQuery.returning.mockResolvedValue([mockInventory]);
      (DeviceInventoryFactory.toDto as jest.Mock).mockReturnValue(mockInventoryDto);

      await repository.create(createDto);

      expect(mockQuery.insert).toHaveBeenCalledWith({
        device_id: 'device-123',
        serial_number: 'SN123456',
        is_available: true,
      });
    });
  });

  describe('findById', () => {
    it('should return inventory with device details when exists', async () => {
      const mockResult = {
        inventory_id: 'inv-123',
        device_id: 'device-123',
        serial_number: 'SN123456',
        is_available: true,
        created_at: new Date(),
        device_device_id: 'device-123',
        brand: 'Apple',
        model: 'MacBook Pro',
        category: 'laptop',
        description: 'Test device',
        default_loan_duration_days: 7,
        device_created_at: new Date(),
        is_deleted: false,
      };

      mockQuery.join.mockReturnThis();
      mockQuery.select.mockReturnThis();
      mockQuery.first.mockResolvedValue(mockResult);

      const result = await repository.findById('inv-123');

      expect(mockDb).toHaveBeenCalledWith('device_inventory');
      expect(mockQuery.join).toHaveBeenCalledWith('devices', 'device_inventory.device_id', 'devices.device_id');
      expect(mockQuery.where).toHaveBeenCalledWith('device_inventory.inventory_id', 'inv-123');
      expect(mockQuery.where).toHaveBeenCalledWith('devices.is_deleted', false);
      expect(result).toEqual(mockResult);
    });

    it('should return null when inventory does not exist', async () => {
      mockQuery.join.mockReturnThis();
      mockQuery.select.mockReturnThis();
      mockQuery.first.mockResolvedValue(undefined);

      const result = await repository.findById('inv-123');

      expect(result).toBeNull();
    });
  });

  describe('findByDeviceId', () => {
    it('should return array of inventories with device details', async () => {
      const mockResults = [
        {
          inventory_id: 'inv-1',
          device_id: 'device-123',
          serial_number: 'SN123456',
          is_available: true,
          created_at: new Date(),
          device_device_id: 'device-123',
          brand: 'Apple',
          model: 'MacBook Pro',
          category: 'laptop',
          description: 'Test device',
          default_loan_duration_days: 7,
          device_created_at: new Date(),
          is_deleted: false,
        },
        {
          inventory_id: 'inv-2',
          device_id: 'device-123',
          serial_number: 'SN123457',
          is_available: false,
          created_at: new Date(),
          device_device_id: 'device-123',
          brand: 'Apple',
          model: 'MacBook Pro',
          category: 'laptop',
          description: 'Test device',
          default_loan_duration_days: 7,
          device_created_at: new Date(),
          is_deleted: false,
        },
      ];

      const mockQueryForFind = createThenable(mockResults);
      mockDb.mockReturnValueOnce(mockQueryForFind);

      const result = await repository.findByDeviceId('device-123');

      expect(mockDb).toHaveBeenCalledWith('device_inventory');
      expect(mockQueryForFind.join).toHaveBeenCalledWith('devices', 'device_inventory.device_id', 'devices.device_id');
      expect(mockQueryForFind.where).toHaveBeenCalledWith('device_inventory.device_id', 'device-123');
      expect(mockQueryForFind.where).toHaveBeenCalledWith('devices.is_deleted', false);
      expect(mockQueryForFind.orderBy).toHaveBeenCalledWith('device_inventory.created_at', 'desc');
      expect(result).toEqual(mockResults);
    });
  });

  describe('findAll', () => {
    it('should return paginated inventories with default options', async () => {
      const mockInventories = [
        {
          inventory_id: 'inv-1',
          device_id: 'device-123',
          serial_number: 'SN123456',
          is_available: true,
          created_at: new Date(),
        },
        {
          inventory_id: 'inv-2',
          device_id: 'device-123',
          serial_number: 'SN123457',
          is_available: false,
          created_at: new Date(),
        },
      ];
      const mockInventoryDtos = [
        {
          inventoryId: 'inv-1',
          deviceId: 'device-123',
          serialNumber: 'SN123456',
          isAvailable: true,
          createdAt: new Date(),
        },
        {
          inventoryId: 'inv-2',
          deviceId: 'device-123',
          serialNumber: 'SN123457',
          isAvailable: false,
          createdAt: new Date(),
        },
      ];

      const mockCountQuery = createThenable({ count: '2' });
      mockCountQuery.first = jest.fn().mockResolvedValue({ count: '2' });
      const mockDataQuery = createThenable(mockInventories);
      
      mockQuery.clone.mockReturnValueOnce(mockCountQuery);
      mockQuery.clone.mockReturnValueOnce(mockDataQuery);
      (DeviceInventoryFactory.toDtoArray as jest.Mock).mockReturnValue(mockInventoryDtos);

      const result = await repository.findAll();

      expect(mockDb).toHaveBeenCalledWith('device_inventory');
      expect(mockQuery.clone).toHaveBeenCalledTimes(2);
      expect(mockDataQuery.orderBy).toHaveBeenCalledWith('created_at', 'desc');
      expect(DeviceInventoryFactory.toDtoArray).toHaveBeenCalledWith(mockInventories);
      expect(result.data).toEqual(mockInventoryDtos);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pageSize).toBe(10);
      expect(result.pagination.totalCount).toBe(2);
    });

    it('should filter by deviceId', async () => {
      const mockCountQuery = createThenable({ count: '1' });
      mockCountQuery.first = jest.fn().mockResolvedValue({ count: '1' });
      const mockDataQuery = createThenable([]);
      
      mockQuery.clone.mockReturnValueOnce(mockCountQuery);
      mockQuery.clone.mockReturnValueOnce(mockDataQuery);
      (DeviceInventoryFactory.toDtoArray as jest.Mock).mockReturnValue([]);

      await repository.findAll({ deviceId: 'device-123' });

      expect(mockQuery.where).toHaveBeenCalledWith('device_id', 'device-123');
    });

    it('should filter by serialNumber', async () => {
      const mockCountQuery = createThenable({ count: '1' });
      mockCountQuery.first = jest.fn().mockResolvedValue({ count: '1' });
      const mockDataQuery = createThenable([]);
      
      mockQuery.clone.mockReturnValueOnce(mockCountQuery);
      mockQuery.clone.mockReturnValueOnce(mockDataQuery);
      (DeviceInventoryFactory.toDtoArray as jest.Mock).mockReturnValue([]);

      await repository.findAll({ serialNumber: 'SN123' });

      expect(mockQuery.whereILike).toHaveBeenCalledWith('serial_number', '%SN123%');
    });

    it('should apply pagination', async () => {
      const mockCountQuery = createThenable({ count: '25' });
      mockCountQuery.first = jest.fn().mockResolvedValue({ count: '25' });
      const mockDataQuery = createThenable([]);
      
      mockQuery.clone.mockReturnValueOnce(mockCountQuery);
      mockQuery.clone.mockReturnValueOnce(mockDataQuery);
      (DeviceInventoryFactory.toDtoArray as jest.Mock).mockReturnValue([]);

      const result = await repository.findAll({ page: 2, pageSize: 10 });

      expect(mockDataQuery.limit).toHaveBeenCalledWith(10);
      expect(mockDataQuery.offset).toHaveBeenCalledWith(10);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.pageSize).toBe(10);
      expect(result.pagination.totalCount).toBe(25);
    });
  });

  describe('update', () => {
    it('should update and return inventory DTO', async () => {
      const updateDto = {
        isAvailable: false,
      };
      const mockUpdatedInventory = {
        inventory_id: 'inv-123',
        device_id: 'device-123',
        serial_number: 'SN123456',
        is_available: false,
        created_at: new Date(),
      };
      const mockInventoryDto = {
        inventoryId: 'inv-123',
        deviceId: 'device-123',
        serialNumber: 'SN123456',
        isAvailable: false,
        createdAt: new Date(),
      };

      (DeviceInventoryFactory.toTable as jest.Mock).mockReturnValue({ is_available: false });
      mockQuery.update.mockReturnThis();
      mockQuery.returning.mockResolvedValue([mockUpdatedInventory]);
      (DeviceInventoryFactory.toDto as jest.Mock).mockReturnValue(mockInventoryDto);

      const result = await repository.update('inv-123', updateDto);

      expect(mockDb).toHaveBeenCalledWith('device_inventory');
      expect(DeviceInventoryFactory.toTable).toHaveBeenCalledWith(updateDto);
      expect(mockQuery.where).toHaveBeenCalledWith('inventory_id', 'inv-123');
      expect(mockQuery.update).toHaveBeenCalledWith({ is_available: false });
      expect(DeviceInventoryFactory.toDto).toHaveBeenCalledWith(mockUpdatedInventory);
      expect(result).toEqual(mockInventoryDto);
    });

    it('should return null when inventory does not exist', async () => {
      (DeviceInventoryFactory.toTable as jest.Mock).mockReturnValue({ is_available: false });
      mockQuery.update.mockReturnThis();
      mockQuery.returning.mockResolvedValue([]);

      const result = await repository.update('inv-123', { isAvailable: false });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should return true when inventory is deleted', async () => {
      mockQuery.delete.mockResolvedValue(1);

      const result = await repository.delete('inv-123');

      expect(mockDb).toHaveBeenCalledWith('device_inventory');
      expect(mockQuery.where).toHaveBeenCalledWith('inventory_id', 'inv-123');
      expect(result).toBe(true);
    });

    it('should return false when inventory does not exist', async () => {
      mockQuery.delete.mockResolvedValue(0);

      const result = await repository.delete('inv-123');

      expect(result).toBe(false);
    });
  });

  describe('findBySerialNumber', () => {
    it('should return inventory DTO when found', async () => {
      const mockInventory = {
        inventory_id: 'inv-123',
        device_id: 'device-123',
        serial_number: 'SN123456',
        is_available: true,
        created_at: new Date(),
      };
      const mockInventoryDto = {
        inventoryId: 'inv-123',
        deviceId: 'device-123',
        serialNumber: 'SN123456',
        isAvailable: true,
        createdAt: new Date(),
      };

      mockQuery.first.mockResolvedValue(mockInventory);
      (DeviceInventoryFactory.toDto as jest.Mock).mockReturnValue(mockInventoryDto);

      const result = await repository.findBySerialNumber('SN123456');

      expect(mockDb).toHaveBeenCalledWith('device_inventory');
      expect(mockQuery.where).toHaveBeenCalledWith('serial_number', 'SN123456');
      expect(DeviceInventoryFactory.toDto).toHaveBeenCalledWith(mockInventory);
      expect(result).toEqual(mockInventoryDto);
    });

    it('should return null when inventory does not exist', async () => {
      mockQuery.first.mockResolvedValue(undefined);

      const result = await repository.findBySerialNumber('SN123456');

      expect(result).toBeNull();
    });

    it('should filter by deviceId when provided', async () => {
      const mockInventory = {
        inventory_id: 'inv-123',
        device_id: 'device-123',
        serial_number: 'SN123456',
        is_available: true,
        created_at: new Date(),
      };
      const mockInventoryDto = {
        inventoryId: 'inv-123',
        deviceId: 'device-123',
        serialNumber: 'SN123456',
        isAvailable: true,
        createdAt: new Date(),
      };

      mockQuery.first.mockResolvedValue(mockInventory);
      (DeviceInventoryFactory.toDto as jest.Mock).mockReturnValue(mockInventoryDto);

      await repository.findBySerialNumber('SN123456', 'device-123');

      expect(mockQuery.where).toHaveBeenCalledWith('serial_number', 'SN123456');
      expect(mockQuery.where).toHaveBeenCalledWith('device_id', 'device-123');
    });
  });
});

