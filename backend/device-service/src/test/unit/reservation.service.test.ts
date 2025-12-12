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
});

