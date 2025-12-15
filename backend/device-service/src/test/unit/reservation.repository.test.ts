/// <reference types="jest" />
import { ReservationRepository } from '../../api/repository/reservation.repository';
import db from '../../database/connection';
import ReservationFactory from '../../api/factory/reservation.factory';
import { Knex } from 'knex';

jest.mock('../../database/connection');
jest.mock('../../api/factory/reservation.factory');

describe('ReservationRepository', () => {
  let repository: ReservationRepository;
  let mockQuery: any;
  let mockTrx: any;
  let mockDb: jest.MockedFunction<any>;

  const createThenable = (value: any) => {
    const thenable = {
      where: jest.fn().mockReturnThis(),
      join: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      first: jest.fn(),
      count: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      forUpdate: jest.fn().mockReturnThis(),
      skipLocked: jest.fn().mockReturnThis(),
      then: jest.fn((resolve) => Promise.resolve(value).then(resolve)),
      catch: jest.fn(),
    };
    return thenable;
  };

  beforeEach(() => {
    repository = new ReservationRepository();
    mockQuery = createThenable([]);
    mockTrx = jest.fn((tableName?: string) => mockQuery) as any;
    mockTrx.fn = {
      now: jest.fn(),
    };
    mockDb = db as jest.MockedFunction<any>;
    mockDb.mockReturnValue(mockQuery);
    jest.clearAllMocks();
  });

  describe('createReservation', () => {
    it('should create reservation within transaction and return DTO', async () => {
      const mockReservation = {
        reservation_id: 'reservation-123',
        user_id: 'user-123',
        device_id: 'device-123',
        inventory_id: 'inv-123',
        reserved_at: new Date(),
        due_date: new Date(),
        status: 'pending',
      };
      const mockReservationDto = {
        reservationId: 'reservation-123',
        userId: 'user-123',
        deviceId: 'device-123',
        inventoryId: 'inv-123',
        reservedAt: new Date(),
        dueDate: new Date(),
        status: 'pending',
      };

      mockQuery.insert.mockReturnThis();
      mockQuery.returning.mockResolvedValue([mockReservation]);
      (ReservationFactory.toDto as jest.Mock).mockReturnValue(mockReservationDto);

      const dueDate = new Date();
      const result = await repository.createReservation(
        mockTrx as Knex.Transaction,
        'user-123',
        'device-123',
        'inv-123',
        dueDate
      );

      expect(mockTrx).toHaveBeenCalledWith('reservations');
      expect(mockQuery.insert).toHaveBeenCalledWith({
        user_id: 'user-123',
        device_id: 'device-123',
        inventory_id: 'inv-123',
        reserved_at: mockTrx.fn.now(),
        due_date: dueDate,
        status: 'pending',
      });
      expect(ReservationFactory.toDto).toHaveBeenCalledWith(mockReservation);
      expect(result).toEqual(mockReservationDto);
    });
  });

  describe('lockAndGetAvailableInventory', () => {
    it('should lock and return available inventory ID', async () => {
      const mockResult = { inventory_id: 'inv-123' };

      mockQuery.forUpdate.mockReturnThis();
      mockQuery.skipLocked.mockReturnThis();
      mockQuery.select.mockReturnThis();
      mockQuery.first.mockResolvedValue(mockResult);

      const result = await repository.lockAndGetAvailableInventory(
        mockTrx as Knex.Transaction,
        'device-123'
      );

      expect(mockTrx).toHaveBeenCalledWith('device_inventory');
      expect(mockQuery.where).toHaveBeenCalledWith('device_id', 'device-123');
      expect(mockQuery.where).toHaveBeenCalledWith('is_available', true);
      expect(mockQuery.forUpdate).toHaveBeenCalled();
      expect(mockQuery.skipLocked).toHaveBeenCalled();
      expect(mockQuery.select).toHaveBeenCalledWith('inventory_id');
      expect(result).toBe('inv-123');
    });

    it('should return null when no available inventory', async () => {
      mockQuery.forUpdate.mockReturnThis();
      mockQuery.skipLocked.mockReturnThis();
      mockQuery.select.mockReturnThis();
      mockQuery.first.mockResolvedValue(undefined);

      const result = await repository.lockAndGetAvailableInventory(
        mockTrx as Knex.Transaction,
        'device-123'
      );

      expect(result).toBeNull();
    });
  });

  describe('markInventoryAsUnavailable', () => {
    it('should mark inventory as unavailable', async () => {
      mockQuery.update.mockResolvedValue(undefined);

      await repository.markInventoryAsUnavailable(mockTrx as Knex.Transaction, 'inv-123');

      expect(mockTrx).toHaveBeenCalledWith('device_inventory');
      expect(mockQuery.where).toHaveBeenCalledWith('inventory_id', 'inv-123');
      expect(mockQuery.update).toHaveBeenCalledWith({ is_available: false });
    });
  });

  describe('findAll', () => {
    it('should return all reservations with details', async () => {
      const mockResults = [
        {
          reservation_id: 'reservation-1',
          user_id: 'user-1',
          device_id: 'device-1',
          inventory_id: 'inv-1',
          reserved_at: new Date(),
          due_date: new Date(),
          status: 'pending',
          user_user_id: 'user-1',
          email: 'user1@example.com',
          first_name: 'John',
          last_name: 'Doe',
          role: 'student',
          user_created_at: new Date(),
          is_active: true,
          user_is_deleted: false,
          device_device_id: 'device-1',
          brand: 'Apple',
          model: 'MacBook Pro',
          category: 'laptop',
          description: 'Test device',
          default_loan_duration_days: 7,
          device_created_at: new Date(),
          is_deleted: false,
          inventory_inventory_id: 'inv-1',
          inventory_device_id: 'device-1',
          serial_number: 'SN123456',
          is_available: false,
          inventory_created_at: new Date(),
        },
      ];

      const mockQueryForFind = createThenable(mockResults);
      mockDb.mockReturnValueOnce(mockQueryForFind);

      const result = await repository.findAll();

      expect(mockDb).toHaveBeenCalledWith('reservations');
      expect(mockQueryForFind.join).toHaveBeenCalledWith('users', 'reservations.user_id', 'users.user_id');
      expect(mockQueryForFind.join).toHaveBeenCalledWith('devices', 'reservations.device_id', 'devices.device_id');
      expect(mockQueryForFind.join).toHaveBeenCalledWith('device_inventory', 'reservations.inventory_id', 'device_inventory.inventory_id');
      expect(mockQueryForFind.where).toHaveBeenCalledWith('users.is_deleted', false);
      expect(mockQueryForFind.where).toHaveBeenCalledWith('devices.is_deleted', false);
      expect(mockQueryForFind.orderBy).toHaveBeenCalledWith('reservations.reserved_at', 'desc');
      expect(result).toEqual(mockResults);
    });

    it('should apply pagination', async () => {
      const mockQueryForFind = createThenable([]);
      mockDb.mockReturnValueOnce(mockQueryForFind);

      await repository.findAll({ page: 2, pageSize: 10 });

      expect(mockQueryForFind.limit).toHaveBeenCalledWith(10);
      expect(mockQueryForFind.offset).toHaveBeenCalledWith(10);
    });
  });

  describe('findByUserId', () => {
    it('should return reservations for specific user', async () => {
      const mockResults = [
        {
          reservation_id: 'reservation-1',
          user_id: 'user-123',
          device_id: 'device-1',
          inventory_id: 'inv-1',
          reserved_at: new Date(),
          due_date: new Date(),
          status: 'pending',
        },
      ];

      const mockQueryForFind = createThenable(mockResults);
      mockDb.mockReturnValueOnce(mockQueryForFind);

      const result = await repository.findByUserId('user-123');

      expect(mockDb).toHaveBeenCalledWith('reservations');
      expect(mockQueryForFind.where).toHaveBeenCalledWith('reservations.user_id', 'user-123');
      expect(mockQueryForFind.orderBy).toHaveBeenCalledWith('reservations.reserved_at', 'desc');
      expect(result).toEqual(mockResults);
    });
  });

  describe('findByUserIdWithPagination', () => {
    it('should return paginated reservations for user', async () => {
      const mockResults = [
        {
          reservation_id: 'reservation-1',
          user_id: 'user-123',
          device_id: 'device-1',
          inventory_id: 'inv-1',
          reserved_at: new Date(),
          due_date: new Date(),
          status: 'pending',
        },
      ];

      const mockQueryForFind = createThenable(mockResults);
      mockDb.mockReturnValueOnce(mockQueryForFind);

      const result = await repository.findByUserIdWithPagination('user-123', { page: 1, pageSize: 10 });

      expect(mockDb).toHaveBeenCalledWith('reservations');
      expect(mockQueryForFind.where).toHaveBeenCalledWith('reservations.user_id', 'user-123');
      expect(mockQueryForFind.limit).toHaveBeenCalledWith(10);
      expect(mockQueryForFind.offset).toHaveBeenCalledWith(0);
      expect(result).toEqual(mockResults);
    });

    it('should use default pagination when not provided', async () => {
      const mockQueryForFind = createThenable([]);
      mockDb.mockReturnValueOnce(mockQueryForFind);

      await repository.findByUserIdWithPagination('user-123');

      expect(mockQueryForFind.limit).toHaveBeenCalledWith(10);
      expect(mockQueryForFind.offset).toHaveBeenCalledWith(0);
    });
  });

  describe('countByUserId', () => {
    it('should return count of reservations for user', async () => {
      const mockResult = { count: '5' };

      mockQuery.join.mockReturnThis();
      mockQuery.count.mockReturnThis();
      mockQuery.first.mockResolvedValue(mockResult);

      const result = await repository.countByUserId('user-123');

      expect(mockDb).toHaveBeenCalledWith('reservations');
      expect(mockQuery.where).toHaveBeenCalledWith('reservations.user_id', 'user-123');
      expect(result).toBe(5);
    });
  });

  describe('findByDeviceId', () => {
    it('should return reservations for specific device', async () => {
      const mockResults = [
        {
          reservation_id: 'reservation-1',
          user_id: 'user-1',
          device_id: 'device-123',
          inventory_id: 'inv-1',
          reserved_at: new Date(),
          due_date: new Date(),
          status: 'pending',
        },
      ];

      const mockQueryForFind = createThenable(mockResults);
      mockDb.mockReturnValueOnce(mockQueryForFind);

      const result = await repository.findByDeviceId('device-123');

      expect(mockDb).toHaveBeenCalledWith('reservations');
      expect(mockQueryForFind.where).toHaveBeenCalledWith('reservations.device_id', 'device-123');
      expect(mockQueryForFind.orderBy).toHaveBeenCalledWith('reservations.reserved_at', 'desc');
      expect(result).toEqual(mockResults);
    });
  });

  describe('findById', () => {
    it('should return reservation DTO when exists', async () => {
      const mockReservation = {
        reservation_id: 'reservation-123',
        user_id: 'user-123',
        device_id: 'device-123',
        inventory_id: 'inv-123',
        reserved_at: new Date(),
        due_date: new Date(),
        status: 'pending',
      };
      const mockReservationDto = {
        reservationId: 'reservation-123',
        userId: 'user-123',
        deviceId: 'device-123',
        inventoryId: 'inv-123',
        reservedAt: new Date(),
        dueDate: new Date(),
        status: 'pending',
      };

      mockQuery.first.mockResolvedValue(mockReservation);
      (ReservationFactory.toDto as jest.Mock).mockReturnValue(mockReservationDto);

      const result = await repository.findById('reservation-123');

      expect(mockDb).toHaveBeenCalledWith('reservations');
      expect(mockQuery.where).toHaveBeenCalledWith('reservation_id', 'reservation-123');
      expect(ReservationFactory.toDto).toHaveBeenCalledWith(mockReservation);
      expect(result).toEqual(mockReservationDto);
    });

    it('should return null when reservation does not exist', async () => {
      mockQuery.first.mockResolvedValue(undefined);

      const result = await repository.findById('reservation-123');

      expect(result).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update reservation status and return DTO', async () => {
      const mockUpdated = {
        reservation_id: 'reservation-123',
        user_id: 'user-123',
        device_id: 'device-123',
        inventory_id: 'inv-123',
        reserved_at: new Date(),
        due_date: new Date(),
        status: 'completed',
      };
      const mockReservationDto = {
        reservationId: 'reservation-123',
        userId: 'user-123',
        deviceId: 'device-123',
        inventoryId: 'inv-123',
        reservedAt: new Date(),
        dueDate: new Date(),
        status: 'completed',
      };

      mockQuery.update.mockReturnThis();
      mockQuery.returning.mockResolvedValue([mockUpdated]);
      (ReservationFactory.toDto as jest.Mock).mockReturnValue(mockReservationDto);

      const result = await repository.updateStatus(
        mockTrx as Knex.Transaction,
        'reservation-123',
        'completed'
      );

      expect(mockTrx).toHaveBeenCalledWith('reservations');
      expect(mockQuery.where).toHaveBeenCalledWith('reservation_id', 'reservation-123');
      expect(mockQuery.update).toHaveBeenCalledWith({ status: 'completed' });
      expect(ReservationFactory.toDto).toHaveBeenCalledWith(mockUpdated);
      expect(result).toEqual(mockReservationDto);
    });

    it('should return null when reservation does not exist', async () => {
      mockQuery.update.mockReturnThis();
      mockQuery.returning.mockResolvedValue([]);

      const result = await repository.updateStatus(
        mockTrx as Knex.Transaction,
        'reservation-123',
        'completed'
      );

      expect(result).toBeNull();
    });
  });

  describe('markInventoryAsAvailable', () => {
    it('should mark inventory as available', async () => {
      mockQuery.update.mockResolvedValue(undefined);

      await repository.markInventoryAsAvailable(mockTrx as Knex.Transaction, 'inv-123');

      expect(mockTrx).toHaveBeenCalledWith('device_inventory');
      expect(mockQuery.where).toHaveBeenCalledWith('inventory_id', 'inv-123');
      expect(mockQuery.update).toHaveBeenCalledWith({ is_available: true });
    });
  });
});

