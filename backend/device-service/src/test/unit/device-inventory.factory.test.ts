/// <reference types="jest" />

import DeviceInventoryFactory from '../../api/factory/device-inventory.factory';
import { DeviceInventoryTable } from '../../api/model/device-inventory.model';
import { DeviceInventoryDto, CreateDeviceInventoryDto } from '../../api/dtos/device-inventory.dto';

describe('DeviceInventoryFactory - Unit Tests', () => {
  const mockInventoryTable: DeviceInventoryTable = {
    inventory_id: 'inventory-123',
    device_id: 'device-123',
    serial_number: 'SN123456',
    is_available: true,
    created_at: new Date('2024-01-01'),
  };

  const mockInventoryDto: DeviceInventoryDto = {
    inventoryId: 'inventory-123',
    deviceId: 'device-123',
    serialNumber: 'SN123456',
    isAvailable: true,
    createdAt: new Date('2024-01-01'),
  };

  describe('toDto', () => {
    it('should convert DeviceInventoryTable to DeviceInventoryDto correctly', () => {
      const result = DeviceInventoryFactory.toDto(mockInventoryTable);

      expect(result).toEqual(mockInventoryDto);
      expect(result.inventoryId).toBe(mockInventoryTable.inventory_id);
      expect(result.deviceId).toBe(mockInventoryTable.device_id);
      expect(result.serialNumber).toBe(mockInventoryTable.serial_number);
      expect(result.isAvailable).toBe(mockInventoryTable.is_available);
      expect(result.createdAt).toBe(mockInventoryTable.created_at);
    });

    it('should handle unavailable inventory', () => {
      const unavailableTable: DeviceInventoryTable = {
        ...mockInventoryTable,
        is_available: false,
      };

      const result = DeviceInventoryFactory.toDto(unavailableTable);

      expect(result.isAvailable).toBe(false);
    });
  });

  describe('toDtoArray', () => {
    it('should convert array of DeviceInventoryTable to array of DeviceInventoryDto', () => {
      const inventoryTables: DeviceInventoryTable[] = [
        mockInventoryTable,
        {
          ...mockInventoryTable,
          inventory_id: 'inventory-456',
          serial_number: 'SN789012',
        },
      ];

      const result = DeviceInventoryFactory.toDtoArray(inventoryTables);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockInventoryDto);
      expect(result[1].inventoryId).toBe('inventory-456');
      expect(result[1].serialNumber).toBe('SN789012');
    });

    it('should return empty array for empty input', () => {
      const result = DeviceInventoryFactory.toDtoArray([]);

      expect(result).toEqual([]);
    });
  });

  describe('toTable', () => {
    it('should convert DeviceInventoryDto to DeviceInventoryTable correctly', () => {
      const result = DeviceInventoryFactory.toTable(mockInventoryDto);

      expect(result.inventory_id).toBe(mockInventoryDto.inventoryId);
      expect(result.device_id).toBe(mockInventoryDto.deviceId);
      expect(result.serial_number).toBe(mockInventoryDto.serialNumber);
      expect(result.is_available).toBe(mockInventoryDto.isAvailable);
      expect(result.created_at).toBe(mockInventoryDto.createdAt);
    });

    it('should handle partial DeviceInventoryDto', () => {
      const partialDto: Partial<DeviceInventoryDto> = {
        serialNumber: 'SN999999',
        isAvailable: false,
      };

      const result = DeviceInventoryFactory.toTable(partialDto);

      expect(result.serial_number).toBe('SN999999');
      expect(result.is_available).toBe(false);
      expect(result.inventory_id).toBeUndefined();
    });
  });

  describe('createDto', () => {
    it('should create DeviceInventoryDto from CreateDeviceInventoryDto', () => {
      const createDto: CreateDeviceInventoryDto = {
        deviceId: 'device-456',
        serialNumber: 'SN111222',
        isAvailable: true,
      };

      const result = DeviceInventoryFactory.createDto(createDto);

      expect(result.deviceId).toBe(createDto.deviceId);
      expect(result.serialNumber).toBe(createDto.serialNumber);
      expect(result.isAvailable).toBe(true);
      expect(result.inventoryId).toBe('');
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should default isAvailable to true when not provided', () => {
      const createDto: CreateDeviceInventoryDto = {
        deviceId: 'device-789',
        serialNumber: 'SN333444',
      };

      const result = DeviceInventoryFactory.createDto(createDto);

      expect(result.isAvailable).toBe(true);
    });

    it('should use provided inventoryId and createdAt if provided', () => {
      const createDto: CreateDeviceInventoryDto = {
        deviceId: 'device-999',
        serialNumber: 'SN555666',
      };

      const customInventoryId = 'custom-inventory-id';
      const customDate = new Date('2024-06-01');

      const result = DeviceInventoryFactory.createDto({
        ...createDto,
        inventoryId: customInventoryId,
        createdAt: customDate,
      });

      expect(result.inventoryId).toBe(customInventoryId);
      expect(result.createdAt).toBe(customDate);
    });
  });
});

