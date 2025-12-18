/// <reference types="jest" />

import { ReservationService } from '../../api/services/reservation.service';
import reservationRepository from '../../api/repository/reservation.repository';
import waitlistService from '../../api/services/waitlist.service';
import db from '../../database/connection';
import { ReservationDto } from '../../api/dtos/reservation.dto';
import { Knex } from 'knex';

// Mock dependencies
jest.mock('../../api/repository/reservation.repository');
jest.mock('../../api/services/waitlist.service');
jest.mock('../../database/connection');

describe('ReservationService - Unit Tests', () => {
  let reservationService: ReservationService;
  const mockReservationRepository = reservationRepository as jest.Mocked<typeof reservationRepository>;
  const mockWaitlistService = waitlistService as jest.Mocked<typeof waitlistService>;
  const mockDb = db as jest.Mocked<typeof db>;

  beforeEach(() => {
    reservationService = new ReservationService();
    jest.clearAllMocks();

    // Mock transaction
    const mockTransaction = {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      fn: {
        now: jest.fn(),
      },
    } as unknown as Knex.Transaction;

    mockDb.transaction = jest.fn().mockResolvedValue(mockTransaction);
  });

  describe('reserveDevice', () => {
    const mockUserId = 'user-123';
    const mockDeviceId = 'device-123';
    const mockInventoryId = 'inventory-123';

    const mockReservation: ReservationDto = {
      reservationId: 'reservation-123',
      userId: mockUserId,
      deviceId: mockDeviceId,
      inventoryId: mockInventoryId,
      reservedAt: new Date(),
      dueDate: new Date(),
      status: 'pending',
    };

    it('should create reservation successfully', async () => {
      const mockTrx = await mockDb.transaction();
      mockReservationRepository.lockAndGetAvailableInventory.mockResolvedValue(mockInventoryId);
      mockReservationRepository.markInventoryAsUnavailable.mockResolvedValue();
      mockReservationRepository.createReservation.mockResolvedValue(mockReservation);
      mockWaitlistService.notifyNextUser.mockResolvedValue();

      const result = await reservationService.reserveDevice(mockUserId, mockDeviceId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockReservation);
      expect(mockReservationRepository.lockAndGetAvailableInventory).toHaveBeenCalled();
      expect(mockReservationRepository.markInventoryAsUnavailable).toHaveBeenCalledWith(mockTrx, mockInventoryId);
      expect(mockReservationRepository.createReservation).toHaveBeenCalled();
      expect(mockTrx.commit).toHaveBeenCalled();
    });

    it('should return error when no inventory available', async () => {
      const mockTrx = await mockDb.transaction();
      mockReservationRepository.lockAndGetAvailableInventory.mockResolvedValue(null);

      const result = await reservationService.reserveDevice(mockUserId, mockDeviceId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('No available devices');
      expect(mockTrx.rollback).toHaveBeenCalled();
      expect(mockReservationRepository.createReservation).not.toHaveBeenCalled();
    });

    it('should return validation error when userId is missing', async () => {
      const mockTrx = await mockDb.transaction();

      const result = await reservationService.reserveDevice('', mockDeviceId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('09');
      expect(mockTrx.rollback).toHaveBeenCalled();
    });

    it('should return validation error when deviceId is missing', async () => {
      const mockTrx = await mockDb.transaction();

      const result = await reservationService.reserveDevice(mockUserId, '');

      expect(result.success).toBe(false);
      expect(result.code).toBe('09');
      expect(mockTrx.rollback).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      const mockTrx = await mockDb.transaction();
      mockReservationRepository.lockAndGetAvailableInventory.mockRejectedValue(new Error('Database error'));

      const result = await reservationService.reserveDevice(mockUserId, mockDeviceId);

      expect(result.success).toBe(false);
      expect(mockTrx.rollback).toHaveBeenCalled();
    });
  });

  describe('cancelReservation', () => {
    const mockUserId = 'user-123';
    const mockReservationId = 'reservation-123';

    const mockReservation: ReservationDto = {
      reservationId: mockReservationId,
      userId: mockUserId,
      deviceId: 'device-123',
      inventoryId: 'inventory-123',
      reservedAt: new Date(),
      dueDate: new Date(),
      status: 'pending',
    };

    it('should cancel reservation successfully', async () => {
      const mockTrx = await mockDb.transaction();
      mockReservationRepository.findById.mockResolvedValue(mockReservation);
      mockReservationRepository.updateStatus.mockResolvedValue({ ...mockReservation, status: 'cancelled' });
      mockReservationRepository.markInventoryAsAvailable.mockResolvedValue();
      mockWaitlistService.notifyNextUser.mockResolvedValue();

      const result = await reservationService.cancelReservation(mockUserId, mockReservationId);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('cancelled');
      expect(mockReservationRepository.updateStatus).toHaveBeenCalled();
      expect(mockReservationRepository.markInventoryAsAvailable).toHaveBeenCalled();
      expect(mockTrx.commit).toHaveBeenCalled();
      // Verify waitlist notification is called (fire and forget, so we don't await it)
      expect(mockWaitlistService.notifyNextUser).toHaveBeenCalledWith(mockReservation.deviceId);
    });

    it('should return error when reservation not found', async () => {
      const mockTrx = await mockDb.transaction();
      mockReservationRepository.findById.mockResolvedValue(null);

      const result = await reservationService.cancelReservation(mockUserId, mockReservationId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('05');
      expect(mockTrx.rollback).toHaveBeenCalled();
    });

    it('should return error when user does not own reservation', async () => {
      const mockTrx = await mockDb.transaction();
      mockReservationRepository.findById.mockResolvedValue({ ...mockReservation, userId: 'other-user' });

      const result = await reservationService.cancelReservation(mockUserId, mockReservationId);

      expect(result.success).toBe(false);
      expect(mockTrx.rollback).toHaveBeenCalled();
    });

    it('should return error when reservation already cancelled', async () => {
      const mockTrx = await mockDb.transaction();
      mockReservationRepository.findById.mockResolvedValue({ ...mockReservation, status: 'cancelled' });

      const result = await reservationService.cancelReservation(mockUserId, mockReservationId);

      expect(result.success).toBe(false);
      expect(mockTrx.rollback).toHaveBeenCalled();
    });
  });

  describe('getMyReservations', () => {
    const mockUserId = 'user-123';
    const mockReservationsData = [
      {
        reservation_id: 'reservation-1',
        user_id: mockUserId,
        device_id: 'device-1',
        inventory_id: 'inventory-1',
        reserved_at: new Date('2024-01-01'),
        due_date: new Date('2024-01-03'),
        status: 'pending',
        email: 'user@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'student',
        brand: 'Apple',
        model: 'MacBook Pro',
        category: 'Laptop',
        serial_number: 'SN123',
        is_available: false,
      },
      {
        reservation_id: 'reservation-2',
        user_id: mockUserId,
        device_id: 'device-2',
        inventory_id: 'inventory-2',
        reserved_at: new Date('2024-01-02'),
        due_date: new Date('2024-01-04'),
        status: 'collected',
        email: 'user@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'student',
        brand: 'Dell',
        model: 'XPS 13',
        category: 'Laptop',
        serial_number: 'SN456',
        is_available: false,
      },
    ];

    it('should get my reservations with pagination successfully', async () => {
      mockReservationRepository.countByUserId.mockResolvedValue(2);
      mockReservationRepository.findByUserIdWithPagination.mockResolvedValue(mockReservationsData);

      const result = await reservationService.getMyReservations(mockUserId, { page: 1, pageSize: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.pagination.totalCount).toBe(2);
      expect(result.data?.pagination.page).toBe(1);
      expect(result.data?.pagination.pageSize).toBe(10);
      expect(result.data?.data).toHaveLength(2);
      expect(result.data?.data[0].reservationId).toBe('reservation-1');
      expect(result.data?.data[0].user.email).toBe('user@example.com');
      expect(result.data?.data[0].device.brand).toBe('Apple');
      expect(mockReservationRepository.countByUserId).toHaveBeenCalledWith(mockUserId);
      expect(mockReservationRepository.findByUserIdWithPagination).toHaveBeenCalledWith(mockUserId, { page: 1, pageSize: 10 });
    });

    it('should use default pagination when options not provided', async () => {
      mockReservationRepository.countByUserId.mockResolvedValue(0);
      mockReservationRepository.findByUserIdWithPagination.mockResolvedValue([]);

      const result = await reservationService.getMyReservations(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data?.pagination.page).toBe(1);
      expect(result.data?.pagination.pageSize).toBe(10);
      expect(mockReservationRepository.findByUserIdWithPagination).toHaveBeenCalledWith(mockUserId, { page: 1, pageSize: 10 });
    });

    it('should calculate pagination metadata correctly', async () => {
      mockReservationRepository.countByUserId.mockResolvedValue(25);
      mockReservationRepository.findByUserIdWithPagination.mockResolvedValue(mockReservationsData.slice(0, 10));

      const result = await reservationService.getMyReservations(mockUserId, { page: 2, pageSize: 10 });

      expect(result.success).toBe(true);
      expect(result.data?.pagination.totalCount).toBe(25);
      expect(result.data?.pagination.totalPages).toBe(3);
      expect(result.data?.pagination.hasNextPage).toBe(true);
      expect(result.data?.pagination.hasPreviousPage).toBe(true);
    });

    it('should return validation error when userId is empty', async () => {
      const result = await reservationService.getMyReservations('');

      expect(result.success).toBe(false);
      expect(result.code).toBe('09');
      expect(mockReservationRepository.countByUserId).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockReservationRepository.countByUserId.mockRejectedValue(new Error('Database error'));

      const result = await reservationService.getMyReservations(mockUserId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('06');
    });
  });

  describe('reserveDevice - Concurrency Handling', () => {
    const mockDeviceId = 'device-123';
    const availableInventoryIds = ['inventory-1', 'inventory-2', 'inventory-3'];
    let inventoryIndex = 0;

    beforeEach(() => {
      // Reset inventory index for each test
      inventoryIndex = 0;
    });

    // Helper to create a mock transaction that simulates row-level locking
    const createMockTransaction = (inventoryId: string | null): Knex.Transaction => {
      const mockTrx = {
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn().mockResolvedValue(undefined),
        fn: {
          now: jest.fn(),
        },
      } as unknown as Knex.Transaction;

      return mockTrx;
    };

    it('should handle concurrent reservation requests and prevent double-booking', async () => {
      // Simulate 5 concurrent requests for a device with only 3 available inventory items
      const concurrentRequests = 5;
      const availableInventory = 3;
      const userIds = Array.from({ length: concurrentRequests }, (_, i) => `user-${i + 1}`);

      // Track which inventory items have been reserved
      const reservedInventory = new Set<string>();
      const successfulReservations: string[] = [];
      const failedReservations: string[] = [];

      // Mock lockAndGetAvailableInventory to simulate row-level locking behavior
      // Each call should return a different inventory ID until none are available
      mockReservationRepository.lockAndGetAvailableInventory.mockImplementation(
        async (trx: Knex.Transaction, deviceId: string) => {
          // Simulate database row-level locking: skipLocked() behavior
          // Only return inventory if it hasn't been reserved yet
          for (const invId of availableInventoryIds) {
            if (!reservedInventory.has(invId)) {
              reservedInventory.add(invId);
              return invId;
            }
          }
          return null; // No more available inventory
        }
      );

      // Mock createReservation to track successful reservations
      mockReservationRepository.createReservation.mockImplementation(
        async (trx: Knex.Transaction, userId: string, deviceId: string, inventoryId: string, dueDate: Date) => {
          successfulReservations.push(inventoryId);
          return {
            reservationId: `reservation-${inventoryId}`,
            userId,
            deviceId,
            inventoryId,
            reservedAt: new Date(),
            dueDate,
            status: 'pending',
          };
        }
      );

      mockReservationRepository.markInventoryAsUnavailable.mockResolvedValue();
      mockWaitlistService.notifyNextUser.mockResolvedValue();

      // Create separate transactions for each concurrent request
      const transactions: Knex.Transaction[] = [];
      for (let i = 0; i < concurrentRequests; i++) {
        const mockTrx = createMockTransaction(availableInventoryIds[i] || null);
        transactions.push(mockTrx);
      }

      // Mock db.transaction to return different transactions for each call
      let transactionIndex = 0;
      mockDb.transaction = jest.fn().mockImplementation(() => {
        return Promise.resolve(transactions[transactionIndex++]);
      });

      // Execute all requests concurrently
      const results = await Promise.all(
        userIds.map((userId) => reservationService.reserveDevice(userId, mockDeviceId))
      );

      // Verify results
      const successful = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);

      // Should have exactly 3 successful reservations (matching available inventory)
      expect(successful).toHaveLength(availableInventory);
      expect(failed).toHaveLength(concurrentRequests - availableInventory);

      // Verify all successful reservations have unique inventory IDs
      const reservedIds = successful.map((r) => r.data?.inventoryId).filter(Boolean) as string[];
      expect(new Set(reservedIds).size).toBe(availableInventory); // No duplicates

      // Verify failed requests have the correct error message
      failed.forEach((result) => {
        expect(result.success).toBe(false);
        expect(result.message).toContain('No available devices');
      });

      // Verify all transactions were properly committed or rolled back
      successful.forEach((_, index) => {
        expect(transactions[index].commit).toHaveBeenCalled();
      });
      failed.forEach((_, index) => {
        expect(transactions[availableInventory + index].rollback).toHaveBeenCalled();
      });

      // Verify lockAndGetAvailableInventory was called for each request
      expect(mockReservationRepository.lockAndGetAvailableInventory).toHaveBeenCalledTimes(concurrentRequests);
    });

    it('should handle concurrent requests from same user for different devices', async () => {
      const userId = 'user-123';
      const deviceIds = ['device-1', 'device-2', 'device-3'];
      const inventoryIds = ['inventory-1', 'inventory-2', 'inventory-3'];

      // Each device has its own inventory, so all should succeed
      mockReservationRepository.lockAndGetAvailableInventory.mockImplementation(
        async (trx: Knex.Transaction, deviceId: string) => {
          const index = deviceIds.indexOf(deviceId);
          return index >= 0 ? inventoryIds[index] : null;
        }
      );

      mockReservationRepository.createReservation.mockImplementation(
        async (trx: Knex.Transaction, userId: string, deviceId: string, inventoryId: string, dueDate: Date) => {
          return {
            reservationId: `reservation-${inventoryId}`,
            userId,
            deviceId,
            inventoryId,
            reservedAt: new Date(),
            dueDate,
            status: 'pending',
          };
        }
      );

      mockReservationRepository.markInventoryAsUnavailable.mockResolvedValue();
      mockWaitlistService.notifyNextUser.mockResolvedValue();

      // Create separate transactions
      const transactions = deviceIds.map(() => createMockTransaction(null));
      let transactionIndex = 0;
      mockDb.transaction = jest.fn().mockImplementation(() => {
        return Promise.resolve(transactions[transactionIndex++]);
      });

      // Execute all requests concurrently
      const results = await Promise.all(
        deviceIds.map((deviceId) => reservationService.reserveDevice(userId, deviceId))
      );

      // All should succeed since they're for different devices
      expect(results.every((r) => r.success)).toBe(true);
      expect(results).toHaveLength(deviceIds.length);

      // Verify each reservation has correct device and inventory
      results.forEach((result, index) => {
        expect(result.data?.deviceId).toBe(deviceIds[index]);
        expect(result.data?.inventoryId).toBe(inventoryIds[index]);
        expect(result.data?.userId).toBe(userId);
      });
    });

    it('should ensure idempotency - same user cannot reserve same device twice concurrently', async () => {
      const userId = 'user-123';
      const deviceId = 'device-123';
      const inventoryId = 'inventory-123';

      let lockCallCount = 0;
      const reservedInventory = new Set<string>();

      // First call succeeds, subsequent calls for same device should fail
      mockReservationRepository.lockAndGetAvailableInventory.mockImplementation(
        async (trx: Knex.Transaction, devId: string) => {
          lockCallCount++;
          if (lockCallCount === 1 && !reservedInventory.has(inventoryId)) {
            reservedInventory.add(inventoryId);
            return inventoryId;
          }
          return null; // No more available after first reservation
        }
      );

      mockReservationRepository.createReservation.mockResolvedValue({
        reservationId: 'reservation-123',
        userId,
        deviceId,
        inventoryId,
        reservedAt: new Date(),
        dueDate: new Date(),
        status: 'pending',
      });

      mockReservationRepository.markInventoryAsUnavailable.mockResolvedValue();
      mockWaitlistService.notifyNextUser.mockResolvedValue();

      // Create transactions
      const transactions = [createMockTransaction(inventoryId), createMockTransaction(null)];
      let transactionIndex = 0;
      mockDb.transaction = jest.fn().mockImplementation(() => {
        return Promise.resolve(transactions[transactionIndex++]);
      });

      // Execute 2 concurrent requests from same user for same device
      const results = await Promise.all([
        reservationService.reserveDevice(userId, deviceId),
        reservationService.reserveDevice(userId, deviceId),
      ]);

      // Only one should succeed
      const successful = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);

      expect(successful).toHaveLength(1);
      expect(failed).toHaveLength(1);
      expect(successful[0].data?.inventoryId).toBe(inventoryId);
      expect(failed[0].message).toContain('No available devices');
    });

    it('should handle race condition when inventory becomes unavailable during transaction', async () => {
      const userId1 = 'user-1';
      const userId2 = 'user-2';
      const deviceId = 'device-123';
      const inventoryId = 'inventory-123';

      let firstCall = true;

      // Simulate race condition: first call gets inventory, second call finds it locked
      mockReservationRepository.lockAndGetAvailableInventory.mockImplementation(
        async (trx: Knex.Transaction, devId: string) => {
          if (firstCall) {
            firstCall = false;
            return inventoryId;
          }
          // Second call finds no available inventory (already locked by first transaction)
          return null;
        }
      );

      mockReservationRepository.createReservation.mockResolvedValue({
        reservationId: 'reservation-123',
        userId: userId1,
        deviceId,
        inventoryId,
        reservedAt: new Date(),
        dueDate: new Date(),
        status: 'pending',
      });

      mockReservationRepository.markInventoryAsUnavailable.mockResolvedValue();
      mockWaitlistService.notifyNextUser.mockResolvedValue();

      // Create transactions with slight delay simulation
      const transactions = [createMockTransaction(inventoryId), createMockTransaction(null)];
      let transactionIndex = 0;
      mockDb.transaction = jest.fn().mockImplementation(() => {
        return Promise.resolve(transactions[transactionIndex++]);
      });

      // Execute requests with slight delay to simulate race condition
      const promise1 = reservationService.reserveDevice(userId1, deviceId);
      // Small delay to ensure first transaction starts
      await new Promise((resolve) => setTimeout(resolve, 10));
      const promise2 = reservationService.reserveDevice(userId2, deviceId);

      const results = await Promise.all([promise1, promise2]);

      // First should succeed, second should fail
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[0].data?.inventoryId).toBe(inventoryId);
      expect(results[1].message).toContain('No available devices');
    });

    it('should properly rollback all operations if transaction fails during concurrent requests', async () => {
      const userId = 'user-123';
      const deviceId = 'device-123';
      const inventoryId = 'inventory-123';

      mockReservationRepository.lockAndGetAvailableInventory.mockResolvedValue(inventoryId);
      mockReservationRepository.markInventoryAsUnavailable.mockResolvedValue();
      // Simulate failure during reservation creation
      mockReservationRepository.createReservation.mockRejectedValue(new Error('Database constraint violation'));

      const mockTrx = createMockTransaction(inventoryId);
      mockDb.transaction = jest.fn().mockResolvedValue(mockTrx);

      const result = await reservationService.reserveDevice(userId, deviceId);

      expect(result.success).toBe(false);
      expect(mockTrx.rollback).toHaveBeenCalled();
      expect(mockTrx.commit).not.toHaveBeenCalled();
      // Verify inventory was locked but transaction rolled back
      expect(mockReservationRepository.lockAndGetAvailableInventory).toHaveBeenCalled();
    });

    it('should handle high concurrency with multiple devices and users', async () => {
      const numDevices = 3;
      const numUsersPerDevice = 4;
      const inventoryPerDevice = 2; // Each device has 2 available items

      const deviceIds = Array.from({ length: numDevices }, (_, i) => `device-${i + 1}`);
      const userIds = Array.from({ length: numDevices * numUsersPerDevice }, (_, i) => `user-${i + 1}`);

      // Track reservations per device
      const deviceReservations = new Map<string, Set<string>>();
      deviceIds.forEach((deviceId) => {
        deviceReservations.set(deviceId, new Set());
      });

      // Mock to return inventory based on device and availability
      mockReservationRepository.lockAndGetAvailableInventory.mockImplementation(
        async (trx: Knex.Transaction, deviceId: string) => {
          const reserved = deviceReservations.get(deviceId) || new Set();
          const availableIds = Array.from({ length: inventoryPerDevice }, (_, i) => `${deviceId}-inv-${i + 1}`);

          for (const invId of availableIds) {
            if (!reserved.has(invId)) {
              reserved.add(invId);
              return invId;
            }
          }
          return null;
        }
      );

      mockReservationRepository.createReservation.mockImplementation(
        async (trx: Knex.Transaction, userId: string, deviceId: string, inventoryId: string, dueDate: Date) => {
          return {
            reservationId: `reservation-${inventoryId}`,
            userId,
            deviceId,
            inventoryId,
            reservedAt: new Date(),
            dueDate,
            status: 'pending',
          };
        }
      );

      mockReservationRepository.markInventoryAsUnavailable.mockResolvedValue();
      mockWaitlistService.notifyNextUser.mockResolvedValue();

      // Create transactions for all requests
      const totalRequests = numDevices * numUsersPerDevice;
      const transactions = Array.from({ length: totalRequests }, () => createMockTransaction(null));
      let transactionIndex = 0;
      mockDb.transaction = jest.fn().mockImplementation(() => {
        return Promise.resolve(transactions[transactionIndex++]);
      });

      // Create requests: each device gets requests from multiple users
      const requests: Promise<any>[] = [];
      let userIndex = 0;
      deviceIds.forEach((deviceId) => {
        for (let i = 0; i < numUsersPerDevice; i++) {
          requests.push(reservationService.reserveDevice(userIds[userIndex++], deviceId));
        }
      });

      const results = await Promise.all(requests);

      // Verify: each device should have exactly inventoryPerDevice successful reservations
      const successfulByDevice = new Map<string, number>();
      results.forEach((result, index) => {
        const deviceIndex = Math.floor(index / numUsersPerDevice);
        const deviceId = deviceIds[deviceIndex];
        if (result.success && result.data) {
          const count = successfulByDevice.get(deviceId) || 0;
          successfulByDevice.set(deviceId, count + 1);
        }
      });

      deviceIds.forEach((deviceId) => {
        expect(successfulByDevice.get(deviceId)).toBe(inventoryPerDevice);
      });

      // Total successful should be numDevices * inventoryPerDevice
      const totalSuccessful = results.filter((r) => r.success).length;
      expect(totalSuccessful).toBe(numDevices * inventoryPerDevice);
    });
  });

  describe('getAllReservations', () => {
    const mockResults = [
      {
        reservation_id: 'reservation-1',
        user_id: 'user-1',
        device_id: 'device-1',
        inventory_id: 'inv-1',
        reserved_at: new Date(),
        due_date: new Date(),
        status: 'pending',
        email: 'user1@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'student',
        brand: 'Apple',
        model: 'MacBook Pro',
        category: 'laptop',
        serial_number: 'SN001',
        is_available: false,
      },
    ];

    it('should return paginated reservations successfully', async () => {
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        join: jest.fn().mockReturnThis(),
        count: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ count: '1' }),
      };
      (mockDb as jest.MockedFunction<any>).mockReturnValue(mockQuery);
      mockReservationRepository.findAll.mockResolvedValue(mockResults);

      const result = await reservationService.getAllReservations({ page: 1, pageSize: 10 });

      expect(result.success).toBe(true);
      expect(result.data?.data).toHaveLength(1);
      expect(result.data?.pagination.totalCount).toBe(1);
    });

    it('should use default pagination when not provided', async () => {
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        join: jest.fn().mockReturnThis(),
        count: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ count: '0' }),
      };
      (mockDb as jest.MockedFunction<any>).mockReturnValue(mockQuery);
      mockReservationRepository.findAll.mockResolvedValue([]);

      const result = await reservationService.getAllReservations();

      expect(result.success).toBe(true);
      expect(result.data?.pagination.page).toBe(1);
      expect(result.data?.pagination.pageSize).toBe(10);
    });

    it('should handle errors gracefully', async () => {
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        join: jest.fn().mockReturnThis(),
        count: jest.fn().mockReturnThis(),
        first: jest.fn().mockRejectedValue(new Error('Database error')),
      };
      (mockDb as jest.MockedFunction<any>).mockReturnValue(mockQuery);

      const result = await reservationService.getAllReservations();

      expect(result.success).toBe(false);
      expect(result.code).toBe('06');
    });
  });

  describe('getReservationsByUserId', () => {
    const mockUserId = 'user-123';
    const mockResults = [
      {
        reservation_id: 'reservation-1',
        user_id: mockUserId,
        device_id: 'device-1',
        inventory_id: 'inv-1',
        reserved_at: new Date(),
        due_date: new Date(),
        status: 'pending',
        email: 'user1@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'student',
        brand: 'Apple',
        model: 'MacBook Pro',
        category: 'laptop',
        serial_number: 'SN001',
        is_available: false,
      },
    ];

    it('should return reservations for user successfully', async () => {
      mockReservationRepository.findByUserId.mockResolvedValue(mockResults);

      const result = await reservationService.getReservationsByUserId(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(mockReservationRepository.findByUserId).toHaveBeenCalledWith(mockUserId);
    });

    it('should return validation error when userId is missing', async () => {
      const result = await reservationService.getReservationsByUserId('');

      expect(result.success).toBe(false);
      expect(result.code).toBe('09');
    });

    it('should handle errors gracefully', async () => {
      mockReservationRepository.findByUserId.mockRejectedValue(new Error('Database error'));

      const result = await reservationService.getReservationsByUserId(mockUserId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('06');
    });
  });

  describe('getReservationsByDeviceId', () => {
    const mockDeviceId = 'device-123';
    const mockResults = [
      {
        reservation_id: 'reservation-1',
        user_id: 'user-1',
        device_id: mockDeviceId,
        inventory_id: 'inv-1',
        reserved_at: new Date(),
        due_date: new Date(),
        status: 'pending',
        email: 'user1@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'student',
        brand: 'Apple',
        model: 'MacBook Pro',
        category: 'laptop',
        serial_number: 'SN001',
        is_available: false,
      },
    ];

    it('should return reservations for device successfully', async () => {
      mockReservationRepository.findByDeviceId.mockResolvedValue(mockResults);

      const result = await reservationService.getReservationsByDeviceId(mockDeviceId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(mockReservationRepository.findByDeviceId).toHaveBeenCalledWith(mockDeviceId);
    });

    it('should return validation error when deviceId is missing', async () => {
      const result = await reservationService.getReservationsByDeviceId('');

      expect(result.success).toBe(false);
      expect(result.code).toBe('09');
    });

    it('should handle errors gracefully', async () => {
      mockReservationRepository.findByDeviceId.mockRejectedValue(new Error('Database error'));

      const result = await reservationService.getReservationsByDeviceId(mockDeviceId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('06');
    });
  });

  describe('cancelReservation - additional error cases', () => {
    const mockUserId = 'user-123';
    const mockReservationId = 'reservation-123';
    const mockReservation: ReservationDto = {
      reservationId: mockReservationId,
      userId: mockUserId,
      deviceId: 'device-123',
      inventoryId: 'inv-123',
      reservedAt: new Date(),
      dueDate: new Date(),
      status: 'pending',
    };

    it('should return error when userId is missing', async () => {
      const mockTrx = await mockDb.transaction();

      const result = await reservationService.cancelReservation('', mockReservationId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('09');
      expect(mockTrx.rollback).toHaveBeenCalled();
    });

    it('should return error when reservationId is missing', async () => {
      const mockTrx = await mockDb.transaction();

      const result = await reservationService.cancelReservation(mockUserId, '');

      expect(result.success).toBe(false);
      expect(result.code).toBe('09');
      expect(mockTrx.rollback).toHaveBeenCalled();
    });

    it('should return error when updateStatus fails', async () => {
      const mockTrx = await mockDb.transaction();
      mockReservationRepository.findById.mockResolvedValue(mockReservation);
      mockReservationRepository.updateStatus.mockResolvedValue(null);

      const result = await reservationService.cancelReservation(mockUserId, mockReservationId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to cancel reservation');
      expect(mockTrx.rollback).toHaveBeenCalled();
    });

    it('should handle errors during cancellation', async () => {
      const mockTrx = await mockDb.transaction();
      mockReservationRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await reservationService.cancelReservation(mockUserId, mockReservationId);

      expect(result.success).toBe(false);
      expect(mockTrx.rollback).toHaveBeenCalled();
    });
  });
});

