/// <reference types="jest" />
import { DeviceRepository } from '../../api/repository/device.repository';
import db from '../../database/connection';
import DeviceFactory from '../../api/factory/device.factory';

jest.mock('../../database/connection');
jest.mock('../../api/factory/device.factory');

describe('DeviceRepository', () => {
  let repository: DeviceRepository;
  let mockQuery: any;
  let mockDb: jest.MockedFunction<any>;

  const createThenable = (value: any) => {
    const thenable = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      whereILike: jest.fn().mockReturnThis(),
      orWhereILike: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      first: jest.fn(),
      count: jest.fn().mockReturnThis(),
      countDistinct: jest.fn().mockReturnThis(),
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
    repository = new DeviceRepository();
    mockQuery = createThenable([]);
    mockDb = db as jest.MockedFunction<any>;
    mockDb.mockReturnValue(mockQuery);
    (db.raw as jest.Mock) = jest.fn();
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return device DTO when device exists', async () => {
      const mockDevice = {
        device_id: 'device-123',
        brand: 'Apple',
        model: 'MacBook Pro',
        category: 'laptop',
        description: 'Test device',
        image_url: 'https://example.com/image.jpg',
        default_loan_duration_days: 7,
        created_at: new Date(),
        is_deleted: false,
      };
      const mockDeviceDto = {
        deviceId: 'device-123',
        brand: 'Apple',
        model: 'MacBook Pro',
        category: 'laptop',
        description: 'Test device',
        imageUrl: 'https://example.com/image.jpg',
        defaultLoanDurationDays: 7,
        createdAt: new Date(),
        isDeleted: false,
      };

      mockQuery.first.mockResolvedValue(mockDevice);
      (DeviceFactory.toDto as jest.Mock).mockReturnValue(mockDeviceDto);

      const result = await repository.findById('device-123');

      expect(mockDb).toHaveBeenCalledWith('devices');
      expect(mockQuery.where).toHaveBeenCalledWith('device_id', 'device-123');
      expect(mockQuery.where).toHaveBeenCalledWith('is_deleted', false);
      expect(DeviceFactory.toDto).toHaveBeenCalledWith(mockDevice);
      expect(result).toEqual(mockDeviceDto);
    });

    it('should return null when device does not exist', async () => {
      mockQuery.first.mockResolvedValue(undefined);

      const result = await repository.findById('device-123');

      expect(result).toBeNull();
      expect(DeviceFactory.toDto).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated devices with default options', async () => {
      const mockDevices = [
        {
          device_id: 'device-1',
          brand: 'Apple',
          model: 'MacBook Pro',
          category: 'laptop',
          description: 'Test device 1',
          image_url: 'https://example.com/image1.jpg',
          default_loan_duration_days: 7,
          created_at: new Date(),
          is_deleted: false,
        },
        {
          device_id: 'device-2',
          brand: 'Dell',
          model: 'XPS 13',
          category: 'laptop',
          description: 'Test device 2',
          image_url: 'https://example.com/image2.jpg',
          default_loan_duration_days: 7,
          created_at: new Date(),
          is_deleted: false,
        },
      ];
      const mockDeviceDtos = [
        {
          deviceId: 'device-1',
          brand: 'Apple',
          model: 'MacBook Pro',
          category: 'laptop',
          description: 'Test device 1',
          imageUrl: 'https://example.com/image1.jpg',
          defaultLoanDurationDays: 7,
          createdAt: new Date(),
          isDeleted: false,
        },
        {
          deviceId: 'device-2',
          brand: 'Dell',
          model: 'XPS 13',
          category: 'laptop',
          description: 'Test device 2',
          imageUrl: 'https://example.com/image2.jpg',
          defaultLoanDurationDays: 7,
          createdAt: new Date(),
          isDeleted: false,
        },
      ];

      const mockCountQuery = createThenable({ count: '2' });
      mockCountQuery.first = jest.fn().mockResolvedValue({ count: '2' });
      const mockDataQuery = createThenable(mockDevices);
      
      mockQuery.clone.mockReturnValueOnce(mockCountQuery);
      mockQuery.clone.mockReturnValueOnce(mockDataQuery);
      (DeviceFactory.toDtoArray as jest.Mock).mockReturnValue(mockDeviceDtos);

      const result = await repository.findAll();

      expect(mockDb).toHaveBeenCalledWith('devices');
      expect(mockQuery.where).toHaveBeenCalledWith('is_deleted', false);
      expect(mockQuery.clone).toHaveBeenCalledTimes(2);
      expect(mockDataQuery.orderBy).toHaveBeenCalledWith('created_at', 'desc');
      expect(DeviceFactory.toDtoArray).toHaveBeenCalledWith(mockDevices);
      expect(result.data).toEqual(mockDeviceDtos);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pageSize).toBe(10);
      expect(result.pagination.totalCount).toBe(2);
    });

    it('should filter by search term', async () => {
      const mockBuilder = {
        whereILike: jest.fn().mockReturnThis(),
        orWhereILike: jest.fn().mockReturnThis(),
      };
      const mockCountQuery = createThenable({ count: '1' });
      mockCountQuery.first = jest.fn().mockResolvedValue({ count: '1' });
      const mockDataQuery = createThenable([]);
      
      mockQuery.andWhere.mockImplementation((callback: any) => {
        callback(mockBuilder);
        return mockQuery;
      });
      mockQuery.clone.mockReturnValueOnce(mockCountQuery);
      mockQuery.clone.mockReturnValueOnce(mockDataQuery);
      (DeviceFactory.toDtoArray as jest.Mock).mockReturnValue([]);

      await repository.findAll({ search: 'Apple' });

      expect(mockQuery.andWhere).toHaveBeenCalled();
      expect(mockBuilder.whereILike).toHaveBeenCalledWith('brand', 'Apple%');
      expect(mockBuilder.orWhereILike).toHaveBeenCalledWith('model', 'Apple%');
      expect(mockBuilder.orWhereILike).toHaveBeenCalledWith('category', 'Apple%');
    });

    it('should not filter by empty search term', async () => {
      const mockCountQuery = createThenable({ count: '0' });
      mockCountQuery.first = jest.fn().mockResolvedValue({ count: '0' });
      const mockDataQuery = createThenable([]);
      
      mockQuery.clone.mockReturnValueOnce(mockCountQuery);
      mockQuery.clone.mockReturnValueOnce(mockDataQuery);
      (DeviceFactory.toDtoArray as jest.Mock).mockReturnValue([]);

      await repository.findAll({ search: '   ' });

      expect(mockQuery.andWhere).not.toHaveBeenCalled();
    });

    it('should apply pagination when page and pageSize are provided', async () => {
      const mockCountQuery = createThenable({ count: '25' });
      mockCountQuery.first = jest.fn().mockResolvedValue({ count: '25' });
      const mockDataQuery = createThenable([]);
      
      mockQuery.clone.mockReturnValueOnce(mockCountQuery);
      mockQuery.clone.mockReturnValueOnce(mockDataQuery);
      (DeviceFactory.toDtoArray as jest.Mock).mockReturnValue([]);

      const result = await repository.findAll({ page: 2, pageSize: 10 });

      expect(mockDataQuery.limit).toHaveBeenCalledWith(10);
      expect(mockDataQuery.offset).toHaveBeenCalledWith(10);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.pageSize).toBe(10);
      expect(result.pagination.totalCount).toBe(25);
      expect(result.pagination.totalPages).toBe(3);
    });
  });

  describe('availableDevices', () => {
    it('should return paginated devices with inventory information', async () => {
      const mockResults = [
        {
          device_id: 'device-1',
          brand: 'Apple',
          model: 'MacBook Pro',
          category: 'laptop',
          description: 'Test device',
          total_units: '5',
          available_units: '3',
        },
      ];

      const mockCountQuery = createThenable({ count: '1' });
      mockCountQuery.first = jest.fn().mockResolvedValue({ count: '1' });
      const mockDataQuery = createThenable(mockResults);
      
      mockQuery.clone.mockReturnValueOnce(mockCountQuery);
      mockQuery.clone.mockReturnValueOnce(mockDataQuery);
      (db.raw as jest.Mock).mockReturnValue('COUNT(...)');

      const result = await repository.availableDevices();

      expect(mockDb).toHaveBeenCalledWith('devices');
      expect(mockQuery.leftJoin).toHaveBeenCalledWith('device_inventory', 'devices.device_id', 'device_inventory.device_id');
      expect(mockQuery.where).toHaveBeenCalledWith('devices.is_deleted', false);
      expect(mockDataQuery.select).toHaveBeenCalled();
      expect(mockDataQuery.groupBy).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].deviceId).toBe('device-1');
      expect(result.data[0].totalUnits).toBe(5);
      expect(result.data[0].availableUnits).toBe(3);
    });

    it('should filter by search term', async () => {
      const mockBuilder = {
        whereILike: jest.fn().mockReturnThis(),
        orWhereILike: jest.fn().mockReturnThis(),
      };
      const mockCountQuery = createThenable({ count: '1' });
      mockCountQuery.first = jest.fn().mockResolvedValue({ count: '1' });
      const mockDataQuery = createThenable([]);
      
      mockQuery.andWhere.mockImplementation((callback: any) => {
        callback(mockBuilder);
        return mockQuery;
      });
      mockQuery.clone.mockReturnValueOnce(mockCountQuery);
      mockQuery.clone.mockReturnValueOnce(mockDataQuery);
      (db.raw as jest.Mock).mockReturnValue('COUNT(...)');

      await repository.availableDevices({ search: 'Apple' });

      expect(mockQuery.andWhere).toHaveBeenCalled();
      expect(mockBuilder.whereILike).toHaveBeenCalledWith('devices.brand', 'Apple%');
    });

    it('should apply pagination', async () => {
      const mockCountQuery = createThenable({ count: '15' });
      mockCountQuery.first = jest.fn().mockResolvedValue({ count: '15' });
      const mockDataQuery = createThenable([]);
      
      mockQuery.clone.mockReturnValueOnce(mockCountQuery);
      mockQuery.clone.mockReturnValueOnce(mockDataQuery);
      (db.raw as jest.Mock).mockReturnValue('COUNT(...)');

      const result = await repository.availableDevices({ page: 2, pageSize: 5 });

      expect(mockDataQuery.limit).toHaveBeenCalledWith(5);
      expect(mockDataQuery.offset).toHaveBeenCalledWith(5);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.pageSize).toBe(5);
      expect(result.pagination.totalCount).toBe(15);
    });

    it('should handle zero available units', async () => {
      const mockResults = [
        {
          device_id: 'device-1',
          brand: 'Apple',
          model: 'MacBook Pro',
          category: 'laptop',
          description: 'Test device',
          total_units: '5',
          available_units: '0',
        },
      ];

      const mockCountQuery = createThenable({ count: '1' });
      mockCountQuery.first = jest.fn().mockResolvedValue({ count: '1' });
      const mockDataQuery = createThenable(mockResults);
      
      mockQuery.clone.mockReturnValueOnce(mockCountQuery);
      mockQuery.clone.mockReturnValueOnce(mockDataQuery);
      (db.raw as jest.Mock).mockReturnValue('COUNT(...)');

      const result = await repository.availableDevices();

      expect(result.data[0].availableUnits).toBe(0);
    });
  });
});
