import request from 'supertest';
import app from '../../device-app';
import reservationRepository from '../../api/repository/reservation.repository';
import waitlistService from '../../api/services/waitlist.service';
import { ReservationDto } from '../../api/dtos/reservation.dto';
import { verifyToken } from '../../api/utils/jwt.utils';
import db from '../../database/connection';
import { Knex } from 'knex';

// Mock repositories and services
jest.mock('../../api/repository/reservation.repository');
jest.mock('../../api/services/waitlist.service');

describe('Reservation API - Integration Tests', () => {
  const studentUserId = 'student-123';
  const deviceId = 'device-123';
  const inventoryId = 'inventory-123';
  const mockToken = 'valid-student-token';

  const mockReservationRepository = reservationRepository as jest.Mocked<typeof reservationRepository>;
  const mockWaitlistService = waitlistService as jest.Mocked<typeof waitlistService>;
  const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;
  const mockDb = db as jest.MockedFunction<typeof db>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock JWT verification
    mockVerifyToken.mockReturnValue({
      userId: studentUserId,
      email: 'student@example.com',
      role: 'student',
    });
  });

  describe('POST /v1/api/reservations/:deviceId/reserve', () => {
    const mockReservation: ReservationDto = {
      reservationId: 'reservation-123',
      userId: studentUserId,
      deviceId: deviceId,
      inventoryId: inventoryId,
      reservedAt: new Date(),
      dueDate: new Date(),
      status: 'pending',
    };

    it('should create reservation successfully', async () => {
      const mockTrx = {
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn().mockResolvedValue(undefined),
        fn: { now: jest.fn() },
      } as unknown as Knex.Transaction;

      (mockDb as any).transaction = jest.fn().mockResolvedValue(mockTrx);

      mockReservationRepository.lockAndGetAvailableInventory.mockResolvedValue(inventoryId);
      mockReservationRepository.markInventoryAsUnavailable.mockResolvedValue();
      mockReservationRepository.createReservation.mockResolvedValue(mockReservation);
      mockWaitlistService.notifyNextUser.mockResolvedValue();

      const response = await request(app)
        .post(`/v1/api/reservations/${deviceId}/reserve`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reservationId).toBeDefined();
      expect(response.body.data.userId).toBe(studentUserId);
      expect(response.body.data.deviceId).toBe(deviceId);
      expect(response.body.data.status).toBe('pending');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .post(`/v1/api/reservations/${deviceId}/reserve`)
        .expect(401);
    });

    it('should return 409 when no inventory available', async () => {
      const mockTrx = {
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn().mockResolvedValue(undefined),
        fn: { now: jest.fn() },
      } as unknown as Knex.Transaction;

      (mockDb as any).transaction = jest.fn().mockResolvedValue(mockTrx);

      mockReservationRepository.lockAndGetAvailableInventory.mockResolvedValue(null);

      const response = await request(app)
        .post(`/v1/api/reservations/${deviceId}/reserve`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /v1/api/reservations/:reservationId/cancel', () => {
    const reservationId = 'reservation-123';

    const mockReservation: ReservationDto = {
      reservationId: reservationId,
      userId: studentUserId,
      deviceId: deviceId,
      inventoryId: inventoryId,
      reservedAt: new Date(),
      dueDate: new Date(),
      status: 'pending',
    };

    it('should cancel reservation successfully', async () => {
      const mockTrx = {
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn().mockResolvedValue(undefined),
        fn: { now: jest.fn() },
      } as unknown as Knex.Transaction;

      (mockDb as any).transaction = jest.fn().mockResolvedValue(mockTrx);

      mockReservationRepository.findById.mockResolvedValue(mockReservation);
      mockReservationRepository.updateStatus.mockResolvedValue({ ...mockReservation, status: 'cancelled' });
      mockReservationRepository.markInventoryAsAvailable.mockResolvedValue();
      mockWaitlistService.notifyNextUser.mockResolvedValue();

      const response = await request(app)
        .patch(`/v1/api/reservations/${reservationId}/cancel`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('cancelled');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .patch(`/v1/api/reservations/${reservationId}/cancel`)
        .expect(401);
    });
  });

  describe('GET /v1/api/reservations/me', () => {
    const mockReservationsData = [
      {
        reservation_id: 'reservation-1',
        user_id: studentUserId,
        device_id: 'device-1',
        inventory_id: 'inventory-1',
        reserved_at: new Date('2024-01-01'),
        due_date: new Date('2024-01-03'),
        status: 'pending',
        email: 'student@example.com',
        first_name: 'Student',
        last_name: 'User',
        role: 'student',
        brand: 'Apple',
        model: 'MacBook Pro',
        category: 'Laptop',
        serial_number: 'SN123',
        is_available: false,
      },
      {
        reservation_id: 'reservation-2',
        user_id: studentUserId,
        device_id: 'device-2',
        inventory_id: 'inventory-2',
        reserved_at: new Date('2024-01-02'),
        due_date: new Date('2024-01-04'),
        status: 'collected',
        email: 'student@example.com',
        first_name: 'Student',
        last_name: 'User',
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

      const response = await request(app)
        .get('/v1/api/reservations/me')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.pagination.totalCount).toBe(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.pageSize).toBe(10);
      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.data[0].reservationId).toBe('reservation-1');
      expect(response.body.data.data[0].user.email).toBe('student@example.com');
      expect(response.body.data.data[0].device.brand).toBe('Apple');
      expect(mockReservationRepository.countByUserId).toHaveBeenCalledWith(studentUserId);
    });

    it('should use default pagination when query params not provided', async () => {
      mockReservationRepository.countByUserId.mockResolvedValue(0);
      mockReservationRepository.findByUserIdWithPagination.mockResolvedValue([]);

      const response = await request(app)
        .get('/v1/api/reservations/me')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.pageSize).toBe(10);
      expect(mockReservationRepository.findByUserIdWithPagination).toHaveBeenCalledWith(studentUserId, { page: 1, pageSize: 10 });
    });

    it('should handle custom pagination parameters', async () => {
      mockReservationRepository.countByUserId.mockResolvedValue(25);
      mockReservationRepository.findByUserIdWithPagination.mockResolvedValue(mockReservationsData.slice(0, 5));

      const response = await request(app)
        .get('/v1/api/reservations/me?page=2&pageSize=5')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.data.pagination.page).toBe(2);
      expect(response.body.data.pagination.pageSize).toBe(5);
      expect(response.body.data.pagination.totalCount).toBe(25);
      expect(response.body.data.pagination.totalPages).toBe(5);
      expect(response.body.data.pagination.hasNextPage).toBe(true);
      expect(response.body.data.pagination.hasPreviousPage).toBe(true);
      expect(mockReservationRepository.findByUserIdWithPagination).toHaveBeenCalledWith(studentUserId, { page: 2, pageSize: 5 });
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .get('/v1/api/reservations/me')
        .expect(401);
    });

    it('should return empty array when no reservations exist', async () => {
      mockReservationRepository.countByUserId.mockResolvedValue(0);
      mockReservationRepository.findByUserIdWithPagination.mockResolvedValue([]);

      const response = await request(app)
        .get('/v1/api/reservations/me')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(0);
      expect(response.body.data.pagination.totalCount).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      mockReservationRepository.countByUserId.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/v1/api/reservations/me')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('06');
    });
  });
});

