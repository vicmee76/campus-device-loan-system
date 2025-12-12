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
});

