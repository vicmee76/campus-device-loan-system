import request from 'supertest';
import { verifyToken } from '../../api/utils/jwt.utils';
import { LoanTable } from '../../api/model/loan.model';
import { ReservationTable } from '../../api/model/reservation.model';

// Mock repositories and services BEFORE importing app
const mockLoanRepoInstance = {
  createLoan: jest.fn(),
  markReturned: jest.fn(),
  findLoanWithReservation: jest.fn(),
  findByReservationId: jest.fn(),
  findAllWithDetails: jest.fn(),
  countAll: jest.fn(),
  findByUserIdWithPagination: jest.fn(),
  countByUserId: jest.fn(),
};

const mockReservationRepoInstance = {
  getReservation: jest.fn(),
  updateStatus: jest.fn(),
};

const mockInventoryRepoInstance = {
  markAvailable: jest.fn(),
};

const mockWaitlistServiceInstance = {
  notifyNext: jest.fn(),
};

jest.mock('../../api/repository/loan.repository', () => ({
  LoanRepository: jest.fn().mockImplementation(() => mockLoanRepoInstance),
}));

jest.mock('../../api/repository/reservation.repository', () => ({
  ReservationRepository: jest.fn().mockImplementation(() => mockReservationRepoInstance),
}));

jest.mock('../../api/repository/inventory.repository', () => ({
  InventoryRepository: jest.fn().mockImplementation(() => mockInventoryRepoInstance),
}));

jest.mock('../../api/services/waitlist-notify.service', () => ({
  WaitlistNotifyService: jest.fn().mockImplementation(() => mockWaitlistServiceInstance),
}));

// Import app after mocks are set up
import app from '../../loan-app';

describe('Loan API - Integration Tests', () => {
  const staffUserId = 'staff-123';
  const studentUserId = 'student-123';
  const reservationId = 'reservation-123';
  const loanId = 'loan-123';
  const deviceId = 'device-123';
  const inventoryId = 'inventory-123';
  const mockStaffToken = 'valid-staff-token';
  const mockStudentToken = 'valid-student-token';

  const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock JWT verification for staff
    mockVerifyToken.mockReturnValue({
      userId: staffUserId,
      email: 'staff@example.com',
      role: 'staff',
    });
  });

  describe('PATCH /v1/api/loans/:reservationId/collect', () => {
    const mockReservation: ReservationTable = {
      reservation_id: reservationId,
      user_id: studentUserId,
      device_id: deviceId,
      inventory_id: inventoryId,
      reserved_at: new Date(),
      due_date: new Date(),
      status: 'pending',
    };

    const mockLoan: LoanTable = {
      loan_id: loanId,
      reservation_id: reservationId,
      collected_at: new Date(),
      returned_at: null,
    };

    it('should collect loan successfully', async () => {
      mockReservationRepoInstance.getReservation.mockResolvedValue(mockReservation);
      mockLoanRepoInstance.createLoan.mockResolvedValue(mockLoan);
      mockLoanRepoInstance.findByReservationId.mockResolvedValue(undefined);
      mockReservationRepoInstance.updateStatus.mockResolvedValue(1);

      const response = await request(app)
        .patch(`/v1/api/loans/${reservationId}/collect`)
        .set('Authorization', `Bearer ${mockStaffToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.loan_id).toBe(loanId);
      expect(response.body.data.reservation_id).toBe(reservationId);
      expect(mockReservationRepoInstance.getReservation).toHaveBeenCalledWith(reservationId);
      expect(mockLoanRepoInstance.createLoan).toHaveBeenCalledWith(reservationId);
      expect(mockReservationRepoInstance.updateStatus).toHaveBeenCalledWith(reservationId, 'collected');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .patch(`/v1/api/loans/${reservationId}/collect`)
        .expect(401);
    });

    it('should return 403 when user is not staff', async () => {
      mockVerifyToken.mockReturnValue({
        userId: studentUserId,
        email: 'student@example.com',
        role: 'student',
      });

      await request(app)
        .patch(`/v1/api/loans/${reservationId}/collect`)
        .set('Authorization', `Bearer ${mockStudentToken}`)
        .expect(403);
    });

    it('should return 404 when reservation not found', async () => {
      mockReservationRepoInstance.getReservation.mockResolvedValue(undefined);

      const response = await request(app)
        .patch(`/v1/api/loans/${reservationId}/collect`)
        .set('Authorization', `Bearer ${mockStaffToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('05');
    });

    it('should return 400 when reservation status is not pending', async () => {
      const collectedReservation = { ...mockReservation, status: 'collected' as const };
      mockReservationRepoInstance.getReservation.mockResolvedValue(collectedReservation);

      const response = await request(app)
        .patch(`/v1/api/loans/${reservationId}/collect`)
        .set('Authorization', `Bearer ${mockStaffToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('09');
    });

    it('should return 400 when loan already exists for reservation', async () => {
      const existingLoan: LoanTable = {
        loan_id: 'existing-loan-123',
        reservation_id: reservationId,
        collected_at: new Date(),
        returned_at: null,
      };

      mockReservationRepoInstance.getReservation.mockResolvedValue(mockReservation);
      mockLoanRepoInstance.findByReservationId.mockResolvedValue(existingLoan);

      const response = await request(app)
        .patch(`/v1/api/loans/${reservationId}/collect`)
        .set('Authorization', `Bearer ${mockStaffToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /v1/api/loans/:loanId/return', () => {
    const mockLoanWithReservation = {
      loan_id: loanId,
      reservation_id: reservationId,
      collected_at: new Date(),
      returned_at: null,
      user_id: studentUserId,
      device_id: deviceId,
      inventory_id: inventoryId,
      status: 'collected',
    };

    const mockReturnedLoan: LoanTable = {
      loan_id: loanId,
      reservation_id: reservationId,
      collected_at: new Date(),
      returned_at: new Date(),
    };

    it('should return loan successfully', async () => {
      mockLoanRepoInstance.findLoanWithReservation.mockResolvedValue(mockLoanWithReservation);
      mockLoanRepoInstance.markReturned.mockResolvedValue(mockReturnedLoan);
      mockInventoryRepoInstance.markAvailable.mockResolvedValue(1);
      mockReservationRepoInstance.updateStatus.mockResolvedValue(1);
      mockWaitlistServiceInstance.notifyNext.mockResolvedValue(undefined);

      const response = await request(app)
        .patch(`/v1/api/loans/${loanId}/return`)
        .set('Authorization', `Bearer ${mockStaffToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Loan returned successfully');
      expect(mockLoanRepoInstance.markReturned).toHaveBeenCalledWith(loanId);
      expect(mockInventoryRepoInstance.markAvailable).toHaveBeenCalledWith(inventoryId);
      expect(mockReservationRepoInstance.updateStatus).toHaveBeenCalledWith(reservationId, 'returned');
      expect(mockWaitlistServiceInstance.notifyNext).toHaveBeenCalledWith(deviceId);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .patch(`/v1/api/loans/${loanId}/return`)
        .expect(401);
    });

    it('should return 403 when user is not staff', async () => {
      mockVerifyToken.mockReturnValue({
        userId: studentUserId,
        email: 'student@example.com',
        role: 'student',
      });

      await request(app)
        .patch(`/v1/api/loans/${loanId}/return`)
        .set('Authorization', `Bearer ${mockStudentToken}`)
        .expect(403);
    });

    it('should return 404 when loan not found', async () => {
      mockLoanRepoInstance.findLoanWithReservation.mockResolvedValue(undefined);

      const response = await request(app)
        .patch(`/v1/api/loans/${loanId}/return`)
        .set('Authorization', `Bearer ${mockStaffToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('05');
    });

    it('should succeed even if waitlist notification fails', async () => {
      mockLoanRepoInstance.findLoanWithReservation.mockResolvedValue(mockLoanWithReservation);
      mockLoanRepoInstance.markReturned.mockResolvedValue(mockReturnedLoan);
      mockInventoryRepoInstance.markAvailable.mockResolvedValue(1);
      mockReservationRepoInstance.updateStatus.mockResolvedValue(1);
      mockWaitlistServiceInstance.notifyNext.mockRejectedValue(new Error('Email service down'));

      const response = await request(app)
        .patch(`/v1/api/loans/${loanId}/return`)
        .set('Authorization', `Bearer ${mockStaffToken}`)
        .expect(200);

      // Should still succeed (graceful degradation)
      expect(response.body.success).toBe(true);
      expect(mockLoanRepoInstance.markReturned).toHaveBeenCalled();
      expect(mockInventoryRepoInstance.markAvailable).toHaveBeenCalled();
      expect(mockReservationRepoInstance.updateStatus).toHaveBeenCalled();
    });
  });

  describe('GET /v1/api/loans/get-all-loans', () => {
    const mockLoansData = [
      {
        loan_id: 'loan-1',
        reservation_id: 'reservation-1',
        collected_at: new Date('2024-01-01'),
        returned_at: null,
        reserved_at: new Date('2024-01-01'),
        due_date: new Date('2024-01-03'),
        status: 'collected',
        user_id: 'user-1',
        email: 'user1@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'student',
        device_id: 'device-1',
        brand: 'Apple',
        model: 'MacBook Pro',
        category: 'Laptop',
        inventory_id: 'inventory-1',
        serial_number: 'SN123',
        is_available: false,
      },
      {
        loan_id: 'loan-2',
        reservation_id: 'reservation-2',
        collected_at: new Date('2024-01-02'),
        returned_at: new Date('2024-01-05'),
        reserved_at: new Date('2024-01-02'),
        due_date: new Date('2024-01-04'),
        status: 'returned',
        user_id: 'user-2',
        email: 'user2@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'staff',
        device_id: 'device-2',
        brand: 'Dell',
        model: 'XPS 13',
        category: 'Laptop',
        inventory_id: 'inventory-2',
        serial_number: 'SN456',
        is_available: true,
      },
    ];

    it('should get all loans with pagination successfully', async () => {
      mockLoanRepoInstance.countAll.mockResolvedValue(2);
      mockLoanRepoInstance.findAllWithDetails.mockResolvedValue(mockLoansData);

      const response = await request(app)
        .get('/v1/api/loans/get-all-loans')
        .set('Authorization', `Bearer ${mockStaffToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.pagination.totalCount).toBe(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.pageSize).toBe(10);
      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.data[0].loanId).toBe('loan-1');
      expect(response.body.data.data[0].user.email).toBe('user1@example.com');
      expect(response.body.data.data[0].device.brand).toBe('Apple');
      expect(response.body.data.data[0].inventory.serialNumber).toBe('SN123');
    });

    it('should use default pagination when query params not provided', async () => {
      mockLoanRepoInstance.countAll.mockResolvedValue(0);
      mockLoanRepoInstance.findAllWithDetails.mockResolvedValue([]);

      const response = await request(app)
        .get('/v1/api/loans/get-all-loans')
        .set('Authorization', `Bearer ${mockStaffToken}`)
        .expect(200);

      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.pageSize).toBe(10);
      expect(mockLoanRepoInstance.findAllWithDetails).toHaveBeenCalledWith({ page: 1, pageSize: 10 });
    });

    it('should handle custom pagination parameters', async () => {
      mockLoanRepoInstance.countAll.mockResolvedValue(25);
      mockLoanRepoInstance.findAllWithDetails.mockResolvedValue(mockLoansData.slice(0, 5));

      const response = await request(app)
        .get('/v1/api/loans/get-all-loans?page=2&pageSize=5')
        .set('Authorization', `Bearer ${mockStaffToken}`)
        .expect(200);

      expect(response.body.data.pagination.page).toBe(2);
      expect(response.body.data.pagination.pageSize).toBe(5);
      expect(response.body.data.pagination.totalCount).toBe(25);
      expect(response.body.data.pagination.totalPages).toBe(5);
      expect(response.body.data.pagination.hasNextPage).toBe(true);
      expect(response.body.data.pagination.hasPreviousPage).toBe(true);
      expect(mockLoanRepoInstance.findAllWithDetails).toHaveBeenCalledWith({ page: 2, pageSize: 5 });
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .get('/v1/api/loans/get-all-loans')
        .expect(401);
    });

    it('should return 403 when user is not staff', async () => {
      mockVerifyToken.mockReturnValue({
        userId: studentUserId,
        email: 'student@example.com',
        role: 'student',
      });

      await request(app)
        .get('/v1/api/loans/get-all-loans')
        .set('Authorization', `Bearer ${mockStudentToken}`)
        .expect(403);
    });

    it('should return empty array when no loans exist', async () => {
      mockLoanRepoInstance.countAll.mockResolvedValue(0);
      mockLoanRepoInstance.findAllWithDetails.mockResolvedValue([]);

      const response = await request(app)
        .get('/v1/api/loans/get-all-loans')
        .set('Authorization', `Bearer ${mockStaffToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(0);
      expect(response.body.data.pagination.totalCount).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      mockLoanRepoInstance.countAll.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/v1/api/loans/get-all-loans')
        .set('Authorization', `Bearer ${mockStaffToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('06');
    });
  });

  describe('GET /v1/api/loans/user/:userId', () => {
    const targetUserId = 'user-456';
    const mockLoansData = [
      {
        loan_id: 'loan-1',
        reservation_id: 'reservation-1',
        collected_at: new Date('2024-01-01'),
        returned_at: null,
        reserved_at: new Date('2024-01-01'),
        due_date: new Date('2024-01-03'),
        status: 'collected',
        user_id: targetUserId,
        email: 'target@example.com',
        first_name: 'Target',
        last_name: 'User',
        role: 'student',
        device_id: 'device-1',
        brand: 'Apple',
        model: 'MacBook Pro',
        category: 'Laptop',
        inventory_id: 'inventory-1',
        serial_number: 'SN123',
        is_available: false,
      },
      {
        loan_id: 'loan-2',
        reservation_id: 'reservation-2',
        collected_at: new Date('2024-01-02'),
        returned_at: new Date('2024-01-05'),
        reserved_at: new Date('2024-01-02'),
        due_date: new Date('2024-01-04'),
        status: 'returned',
        user_id: targetUserId,
        email: 'target@example.com',
        first_name: 'Target',
        last_name: 'User',
        role: 'student',
        device_id: 'device-2',
        brand: 'Dell',
        model: 'XPS 13',
        category: 'Laptop',
        inventory_id: 'inventory-2',
        serial_number: 'SN456',
        is_available: true,
      },
    ];

    it('should get loans by user ID with pagination successfully', async () => {
      mockLoanRepoInstance.countByUserId.mockResolvedValue(2);
      mockLoanRepoInstance.findByUserIdWithPagination.mockResolvedValue(mockLoansData);

      const response = await request(app)
        .get(`/v1/api/loans/user/${targetUserId}`)
        .set('Authorization', `Bearer ${mockStaffToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.pagination.totalCount).toBe(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.pageSize).toBe(10);
      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.data[0].loanId).toBe('loan-1');
      expect(response.body.data.data[0].user.email).toBe('target@example.com');
      expect(response.body.data.data[0].device.brand).toBe('Apple');
      expect(mockLoanRepoInstance.countByUserId).toHaveBeenCalledWith(targetUserId);
      expect(mockLoanRepoInstance.findByUserIdWithPagination).toHaveBeenCalledWith(targetUserId, { page: 1, pageSize: 10 });
    });

    it('should use default pagination when query params not provided', async () => {
      mockLoanRepoInstance.countByUserId.mockResolvedValue(0);
      mockLoanRepoInstance.findByUserIdWithPagination.mockResolvedValue([]);

      const response = await request(app)
        .get(`/v1/api/loans/user/${targetUserId}`)
        .set('Authorization', `Bearer ${mockStaffToken}`)
        .expect(200);

      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.pageSize).toBe(10);
      expect(mockLoanRepoInstance.findByUserIdWithPagination).toHaveBeenCalledWith(targetUserId, { page: 1, pageSize: 10 });
    });

    it('should handle custom pagination parameters', async () => {
      mockLoanRepoInstance.countByUserId.mockResolvedValue(25);
      mockLoanRepoInstance.findByUserIdWithPagination.mockResolvedValue(mockLoansData.slice(0, 5));

      const response = await request(app)
        .get(`/v1/api/loans/user/${targetUserId}?page=2&pageSize=5`)
        .set('Authorization', `Bearer ${mockStaffToken}`)
        .expect(200);

      expect(response.body.data.pagination.page).toBe(2);
      expect(response.body.data.pagination.pageSize).toBe(5);
      expect(response.body.data.pagination.totalCount).toBe(25);
      expect(response.body.data.pagination.totalPages).toBe(5);
      expect(response.body.data.pagination.hasNextPage).toBe(true);
      expect(response.body.data.pagination.hasPreviousPage).toBe(true);
      expect(mockLoanRepoInstance.findByUserIdWithPagination).toHaveBeenCalledWith(targetUserId, { page: 2, pageSize: 5 });
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .get(`/v1/api/loans/user/${targetUserId}`)
        .expect(401);
    });

    it('should return 403 when user is not staff', async () => {
      mockVerifyToken.mockReturnValue({
        userId: studentUserId,
        email: 'student@example.com',
        role: 'student',
      });

      await request(app)
        .get(`/v1/api/loans/user/${targetUserId}`)
        .set('Authorization', `Bearer ${mockStudentToken}`)
        .expect(403);
    });

    it('should return empty array when no loans exist for user', async () => {
      mockLoanRepoInstance.countByUserId.mockResolvedValue(0);
      mockLoanRepoInstance.findByUserIdWithPagination.mockResolvedValue([]);

      const response = await request(app)
        .get(`/v1/api/loans/user/${targetUserId}`)
        .set('Authorization', `Bearer ${mockStaffToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(0);
      expect(response.body.data.pagination.totalCount).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      mockLoanRepoInstance.countByUserId.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get(`/v1/api/loans/user/${targetUserId}`)
        .set('Authorization', `Bearer ${mockStaffToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('06');
    });
  });
});

