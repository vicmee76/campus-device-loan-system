/// <reference types="jest" />

import DeviceFactory from '../../api/factory/device.factory';
import { DeviceTable } from '../../api/model/device.model';
import { DeviceDto, CreateDeviceDto } from '../../api/dtos/device.dto';

describe('DeviceFactory - Unit Tests', () => {
  const mockDeviceTable: DeviceTable = {
    device_id: 'device-123',
    brand: 'Apple',
    model: 'MacBook Pro',
    category: 'Laptop',
    description: 'High-performance laptop',
    default_loan_duration_days: 7,
    image_url: 'https://example.com/image.jpg',
    created_at: new Date('2024-01-01'),
    is_deleted: false,
  };

  const mockDeviceDto: DeviceDto = {
    deviceId: 'device-123',
    brand: 'Apple',
    model: 'MacBook Pro',
    category: 'Laptop',
    description: 'High-performance laptop',
    defaultLoanDurationDays: 7,
    createdAt: new Date('2024-01-01'),
    isDeleted: false,
  };

  describe('toDto', () => {
    it('should convert DeviceTable to DeviceDto correctly', () => {
      const result = DeviceFactory.toDto(mockDeviceTable);

      expect(result).toEqual(mockDeviceDto);
      expect(result.deviceId).toBe(mockDeviceTable.device_id);
      expect(result.brand).toBe(mockDeviceTable.brand);
      expect(result.model).toBe(mockDeviceTable.model);
      expect(result.category).toBe(mockDeviceTable.category);
      expect(result.description).toBe(mockDeviceTable.description);
      expect(result.defaultLoanDurationDays).toBe(mockDeviceTable.default_loan_duration_days);
      expect(result.createdAt).toBe(mockDeviceTable.created_at);
      expect(result.isDeleted).toBe(mockDeviceTable.is_deleted);
    });

    it('should handle null description', () => {
      const deviceWithNullDesc: DeviceTable = {
        ...mockDeviceTable,
        description: null,
      };

      const result = DeviceFactory.toDto(deviceWithNullDesc);

      expect(result.description).toBeNull();
    });
  });

  describe('toDtoArray', () => {
    it('should convert array of DeviceTable to array of DeviceDto', () => {
      const deviceTables: DeviceTable[] = [
        mockDeviceTable,
        {
          ...mockDeviceTable,
          device_id: 'device-456',
          brand: 'Dell',
        },
      ];

      const result = DeviceFactory.toDtoArray(deviceTables);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockDeviceDto);
      expect(result[1].deviceId).toBe('device-456');
      expect(result[1].brand).toBe('Dell');
    });

    it('should return empty array for empty input', () => {
      const result = DeviceFactory.toDtoArray([]);

      expect(result).toEqual([]);
    });
  });

  describe('toTable', () => {
    it('should convert DeviceDto to DeviceTable correctly', () => {
      const result = DeviceFactory.toTable(mockDeviceDto);

      expect(result.device_id).toBe(mockDeviceDto.deviceId);
      expect(result.brand).toBe(mockDeviceDto.brand);
      expect(result.model).toBe(mockDeviceDto.model);
      expect(result.category).toBe(mockDeviceDto.category);
      expect(result.description).toBe(mockDeviceDto.description);
      expect(result.default_loan_duration_days).toBe(mockDeviceDto.defaultLoanDurationDays);
      expect(result.created_at).toBe(mockDeviceDto.createdAt);
      expect(result.is_deleted).toBe(mockDeviceDto.isDeleted);
    });

    it('should handle partial DeviceDto', () => {
      const partialDto: Partial<DeviceDto> = {
        brand: 'HP',
        model: 'EliteBook',
      };

      const result = DeviceFactory.toTable(partialDto);

      expect(result.brand).toBe('HP');
      expect(result.model).toBe('EliteBook');
      expect(result.device_id).toBeUndefined();
    });

    it('should only include defined fields', () => {
      const minimalDto: Partial<DeviceDto> = {
        deviceId: 'device-789',
      };

      const result = DeviceFactory.toTable(minimalDto);

      expect(result.device_id).toBe('device-789');
      expect(result.brand).toBeUndefined();
    });
  });

  describe('createDto', () => {
    it('should create DeviceDto from CreateDeviceDto with all fields', () => {
      const createDto: CreateDeviceDto = {
        brand: 'Lenovo',
        model: 'ThinkPad',
        category: 'Laptop',
        description: 'Business laptop',
        defaultLoanDurationDays: 5,
      };

      const result = DeviceFactory.createDto(createDto);

      expect(result.brand).toBe(createDto.brand);
      expect(result.model).toBe(createDto.model);
      expect(result.category).toBe(createDto.category);
      expect(result.description).toBe(createDto.description);
      expect(result.defaultLoanDurationDays).toBe(createDto.defaultLoanDurationDays);
      expect(result.isDeleted).toBe(false);
      expect(result.deviceId).toBe('');
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should use default values when optional fields are missing', () => {
      const createDto: CreateDeviceDto = {
        brand: 'Samsung',
        model: 'Galaxy Tab',
        category: 'Tablet',
      };

      const result = DeviceFactory.createDto(createDto);

      expect(result.description).toBeNull();
      expect(result.defaultLoanDurationDays).toBe(2);
      expect(result.isDeleted).toBe(false);
    });

    it('should use provided deviceId and createdAt if provided', () => {
      const createDto: CreateDeviceDto = {
        brand: 'Microsoft',
        model: 'Surface',
        category: 'Tablet',
      };

      const customDeviceId = 'custom-device-id';
      const customDate = new Date('2024-06-01');

      const result = DeviceFactory.createDto({
        ...createDto,
        deviceId: customDeviceId,
        createdAt: customDate,
      });

      expect(result.deviceId).toBe(customDeviceId);
      expect(result.createdAt).toBe(customDate);
    });
  });
});

