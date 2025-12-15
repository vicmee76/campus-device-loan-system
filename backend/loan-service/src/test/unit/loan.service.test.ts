import { LoanTable } from '../../api/model/loan.model';
import { ReservationTable } from '../../api/model/reservation.model';

// Create mock instances BEFORE importing the service
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

// Mock dependencies BEFORE importing the service
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

// Import service AFTER mocks are set up
import { LoanService } from '../../api/services/loan.service';

describe('LoanService - Unit Tests', () => {
  let loanService: LoanService;

  beforeEach(() => {
    jest.clearAllMocks();
    loanService = new LoanService();
  });

  describe('collect', () => {
    const mockReservationId = 'reservation-123';
    const mockLoanId = 'loan-123';

    const mockReservation: ReservationTable = {
      reservation_id: mockReservationId,
      user_id: 'user-123',
      device_id: 'device-123',
      inventory_id: 'inventory-123',
      reserved_at: new Date(),
      due_date: new Date(),
      status: 'pending',
    };

    const mockLoan: LoanTable = {
      loan_id: mockLoanId,
      reservation_id: mockReservationId,
      collected_at: new Date(),
      returned_at: null,
    };

    it('should collect loan successfully', async () => {
      mockReservationRepoInstance.getReservation.mockResolvedValue(mockReservation);
      mockLoanRepoInstance.createLoan.mockResolvedValue(mockLoan);
      mockLoanRepoInstance.findByReservationId.mockResolvedValue(undefined);
      mockReservationRepoInstance.updateStatus.mockResolvedValue(1);

      const result = await loanService.collect(mockReservationId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockLoan);
      expect(result.message).toBe('Loan collected successfully');
      expect(mockReservationRepoInstance.getReservation).toHaveBeenCalledWith(mockReservationId);
      expect(mockLoanRepoInstance.createLoan).toHaveBeenCalledWith(mockReservationId);
      expect(mockReservationRepoInstance.updateStatus).toHaveBeenCalledWith(mockReservationId, 'collected');
    });

    it('should return error when reservation not found', async () => {
      mockReservationRepoInstance.getReservation.mockResolvedValue(undefined);

      const result = await loanService.collect(mockReservationId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('05');
      expect(result.message).toBe('Reservation not found');
    });

    it('should return validation error when reservation status is not pending', async () => {
      const cancelledReservation = { ...mockReservation, status: 'cancelled' as const };
      mockReservationRepoInstance.getReservation.mockResolvedValue(cancelledReservation);

      const result = await loanService.collect(mockReservationId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('09');
      expect(result.message).toContain('cannot be collected');
    });

    it('should return error when loan creation fails', async () => {
      mockReservationRepoInstance.getReservation.mockResolvedValue(mockReservation);
      mockLoanRepoInstance.findByReservationId.mockResolvedValue(undefined);
      mockLoanRepoInstance.createLoan.mockRejectedValue(new Error('Database error'));

      const result = await loanService.collect(mockReservationId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('06');
    });

    it('should handle non-Error objects thrown during collection', async () => {
      mockReservationRepoInstance.getReservation.mockResolvedValue(mockReservation);
      mockLoanRepoInstance.findByReservationId.mockResolvedValue(undefined);
      mockLoanRepoInstance.createLoan.mockRejectedValue('String error');

      const result = await loanService.collect(mockReservationId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('06');
      expect(result.message).toBe('Failed to collect loan');
    });
  });

  describe('returnLoan', () => {
    const mockLoanId = 'loan-123';
    const mockReservationId = 'reservation-123';
    const mockDeviceId = 'device-123';
    const mockInventoryId = 'inventory-123';

    const mockLoanWithReservation = {
      loan_id: mockLoanId,
      reservation_id: mockReservationId,
      collected_at: new Date(),
      returned_at: null,
      user_id: 'user-123',
      device_id: mockDeviceId,
      inventory_id: mockInventoryId,
      status: 'collected',
    };

    const mockReturnedLoan: LoanTable = {
      loan_id: mockLoanId,
      reservation_id: mockReservationId,
      collected_at: new Date(),
      returned_at: new Date(),
    };

    it('should return loan successfully', async () => {
      mockLoanRepoInstance.findLoanWithReservation.mockResolvedValue(mockLoanWithReservation);
      mockLoanRepoInstance.markReturned.mockResolvedValue(mockReturnedLoan);
      mockInventoryRepoInstance.markAvailable.mockResolvedValue(1);
      mockReservationRepoInstance.updateStatus.mockResolvedValue(1);
      mockWaitlistServiceInstance.notifyNext.mockResolvedValue(undefined);

      const result = await loanService.returnLoan(mockLoanId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Loan returned successfully');
      expect(mockLoanRepoInstance.markReturned).toHaveBeenCalledWith(mockLoanId);
      expect(mockInventoryRepoInstance.markAvailable).toHaveBeenCalledWith(mockInventoryId);
      expect(mockReservationRepoInstance.updateStatus).toHaveBeenCalledWith(mockReservationId, 'returned');
      expect(mockWaitlistServiceInstance.notifyNext).toHaveBeenCalledWith(mockDeviceId);
    });

    it('should return error when loan not found', async () => {
      mockLoanRepoInstance.findLoanWithReservation.mockResolvedValue(undefined);

      const result = await loanService.returnLoan(mockLoanId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('05');
      expect(result.message).toBe('Loan not found');
    });

    it('should continue even if waitlist notification fails', async () => {
      mockLoanRepoInstance.findLoanWithReservation.mockResolvedValue(mockLoanWithReservation);
      mockLoanRepoInstance.markReturned.mockResolvedValue(mockReturnedLoan);
      mockInventoryRepoInstance.markAvailable.mockResolvedValue(1);
      mockReservationRepoInstance.updateStatus.mockResolvedValue(1);
      mockWaitlistServiceInstance.notifyNext.mockRejectedValue(new Error('Email service down'));

      const result = await loanService.returnLoan(mockLoanId);

      // Should still succeed despite waitlist notification failure (graceful degradation)
      expect(result.success).toBe(true);
      expect(mockLoanRepoInstance.markReturned).toHaveBeenCalled();
      expect(mockInventoryRepoInstance.markAvailable).toHaveBeenCalled();
      expect(mockReservationRepoInstance.updateStatus).toHaveBeenCalled();
    });

    it('should return error when database operation fails', async () => {
      mockLoanRepoInstance.findLoanWithReservation.mockRejectedValue(new Error('Database error'));

      const result = await loanService.returnLoan(mockLoanId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('06');
    });

    it('should handle non-Error objects thrown during return', async () => {
      mockLoanRepoInstance.findLoanWithReservation.mockRejectedValue({ code: 'DB_ERROR', message: 'Database connection lost' });

      const result = await loanService.returnLoan(mockLoanId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('06');
      expect(result.message).toBe('Failed to return loan');
    });
  });

  describe('getAllLoans', () => {
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

      const result = await loanService.getAllLoans({ page: 1, pageSize: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.pagination.totalCount).toBe(2);
      expect(result.data?.pagination.page).toBe(1);
      expect(result.data?.pagination.pageSize).toBe(10);
      expect(result.data?.pagination.totalPages).toBe(1);
      expect(result.data?.data).toHaveLength(2);
      expect(result.data?.data[0].loanId).toBe('loan-1');
      expect(result.data?.data[0].user.email).toBe('user1@example.com');
      expect(result.data?.data[0].device.brand).toBe('Apple');
      expect(result.data?.data[0].inventory.serialNumber).toBe('SN123');
    });

    it('should use default pagination when options not provided', async () => {
      mockLoanRepoInstance.countAll.mockResolvedValue(0);
      mockLoanRepoInstance.findAllWithDetails.mockResolvedValue([]);

      const result = await loanService.getAllLoans();

      expect(result.success).toBe(true);
      expect(result.data?.pagination.page).toBe(1);
      expect(result.data?.pagination.pageSize).toBe(10);
      expect(mockLoanRepoInstance.findAllWithDetails).toHaveBeenCalledWith({ page: 1, pageSize: 10 });
    });

    it('should calculate pagination metadata correctly', async () => {
      mockLoanRepoInstance.countAll.mockResolvedValue(25);
      mockLoanRepoInstance.findAllWithDetails.mockResolvedValue(mockLoansData.slice(0, 10));

      const result = await loanService.getAllLoans({ page: 2, pageSize: 10 });

      expect(result.success).toBe(true);
      expect(result.data?.pagination.totalCount).toBe(25);
      expect(result.data?.pagination.totalPages).toBe(3);
      expect(result.data?.pagination.hasNextPage).toBe(true);
      expect(result.data?.pagination.hasPreviousPage).toBe(true);
    });

    it('should return error when database query fails', async () => {
      mockLoanRepoInstance.countAll.mockRejectedValue(new Error('Database error'));

      const result = await loanService.getAllLoans();

      expect(result.success).toBe(false);
      expect(result.code).toBe('06');
    });

    it('should handle non-Error objects thrown during getAllLoans', async () => {
      mockLoanRepoInstance.countAll.mockRejectedValue(null);

      const result = await loanService.getAllLoans();

      expect(result.success).toBe(false);
      expect(result.code).toBe('06');
      expect(result.message).toBe('Failed to retrieve loans');
    });
  });

  describe('getLoansByUserId', () => {
    const mockUserId = 'user-123';
    const mockLoansData = [
      {
        loan_id: 'loan-1',
        reservation_id: 'reservation-1',
        collected_at: new Date('2024-01-01'),
        returned_at: null,
        reserved_at: new Date('2024-01-01'),
        due_date: new Date('2024-01-03'),
        status: 'collected',
        user_id: mockUserId,
        email: 'user@example.com',
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
        user_id: mockUserId,
        email: 'user@example.com',
        first_name: 'John',
        last_name: 'Doe',
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

      const result = await loanService.getLoansByUserId(mockUserId, { page: 1, pageSize: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.pagination.totalCount).toBe(2);
      expect(result.data?.pagination.page).toBe(1);
      expect(result.data?.pagination.pageSize).toBe(10);
      expect(result.data?.data).toHaveLength(2);
      expect(result.data?.data[0].loanId).toBe('loan-1');
      expect(result.data?.data[0].user.email).toBe('user@example.com');
      expect(result.data?.data[0].device.brand).toBe('Apple');
      expect(mockLoanRepoInstance.countByUserId).toHaveBeenCalledWith(mockUserId);
      expect(mockLoanRepoInstance.findByUserIdWithPagination).toHaveBeenCalledWith(mockUserId, { page: 1, pageSize: 10 });
    });

    it('should use default pagination when options not provided', async () => {
      mockLoanRepoInstance.countByUserId.mockResolvedValue(0);
      mockLoanRepoInstance.findByUserIdWithPagination.mockResolvedValue([]);

      const result = await loanService.getLoansByUserId(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data?.pagination.page).toBe(1);
      expect(result.data?.pagination.pageSize).toBe(10);
      expect(mockLoanRepoInstance.findByUserIdWithPagination).toHaveBeenCalledWith(mockUserId, { page: 1, pageSize: 10 });
    });

    it('should calculate pagination metadata correctly', async () => {
      mockLoanRepoInstance.countByUserId.mockResolvedValue(25);
      mockLoanRepoInstance.findByUserIdWithPagination.mockResolvedValue(mockLoansData.slice(0, 10));

      const result = await loanService.getLoansByUserId(mockUserId, { page: 2, pageSize: 10 });

      expect(result.success).toBe(true);
      expect(result.data?.pagination.totalCount).toBe(25);
      expect(result.data?.pagination.totalPages).toBe(3);
      expect(result.data?.pagination.hasNextPage).toBe(true);
      expect(result.data?.pagination.hasPreviousPage).toBe(true);
    });

    it('should return validation error when userId is empty', async () => {
      const result = await loanService.getLoansByUserId('');

      expect(result.success).toBe(false);
      expect(result.code).toBe('09');
      expect(mockLoanRepoInstance.countByUserId).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockLoanRepoInstance.countByUserId.mockRejectedValue(new Error('Database error'));

      const result = await loanService.getLoansByUserId(mockUserId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('06');
    });

    it('should handle non-Error objects thrown during getLoansByUserId', async () => {
      mockLoanRepoInstance.countByUserId.mockRejectedValue(123);

      const result = await loanService.getLoansByUserId(mockUserId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('06');
      expect(result.message).toBe('Failed to retrieve loans');
    });
  });
});

