import { LoanRepository } from "../repository/loan.repository";
import { ReservationRepository } from "../repository/reservation.repository";
import { InventoryRepository } from "../repository/inventory.repository";
import { WaitlistNotifyService } from "./waitlist-notify.service";
import { logger } from "../utils/logger";
import { ResponseHelper, ApiResponse } from "../dtos/response.dto";
import { LoanTable } from "../model/loan.model";
import { PaginatedResult, LoanWithDetailsDto } from "../dtos/loan.dto";

const loanRepo = new LoanRepository();
const reservationRepo = new ReservationRepository();
const inventoryRepo = new InventoryRepository();
const waitlistService = new WaitlistNotifyService();

export class LoanService {
  async collect(reservationId: string): Promise<ApiResponse<LoanTable | null>> {
    logger.debug('collect called', { reservationId });
    
    try {
      const reservation = await reservationRepo.getReservation(reservationId);
      
      if (!reservation) {
        logger.warn('collect: reservation not found', { reservationId });
        return ResponseHelper.notFound('Reservation not found');
      }
      
      if (reservation.status !== 'pending') {
        logger.warn('collect: reservation cannot be collected', { 
          reservationId, 
          status: reservation.status 
        });
        return ResponseHelper.validationError('Reservation cannot be collected. Status must be pending.');
      }

      // Check if a loan already exists for this reservation
      const existingLoan = await loanRepo.findByReservationId(reservationId);
      if (existingLoan) {
        logger.warn('collect: loan already exists for reservation', { reservationId });
        return ResponseHelper.validationError('Loan already exists for this reservation.');
      }

      const loan = await loanRepo.createLoan(reservationId);
      await reservationRepo.updateStatus(reservationId, 'collected');
      
      logger.info('Loan collected successfully', { 
        loanId: loan.loan_id, 
        reservationId 
      });
      
      return ResponseHelper.success(loan, 'Loan collected successfully');
    } catch (error) {
      logger.error('collect failed', error, { reservationId });
      return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to collect loan');
    }
  }

  async returnLoan(loanId: string): Promise<ApiResponse<{ message: string } | null>> {
    logger.debug('returnLoan called', { loanId });
    
    try {
      const loanWithReservation = await loanRepo.findLoanWithReservation(loanId);
      
      if (!loanWithReservation) {
        logger.warn('returnLoan: loan not found', { loanId });
        return ResponseHelper.notFound('Loan not found');
      }

      // Mark loan as returned
      await loanRepo.markReturned(loanId);
      
      // Mark inventory as available
      await inventoryRepo.markAvailable(loanWithReservation.inventory_id);
      
      // Update reservation status
      await reservationRepo.updateStatus(loanWithReservation.reservation_id, 'returned');

      // Notify next user in waitlist (graceful degradation - don't fail if this fails)
      try {
        await waitlistService.notifyNext(loanWithReservation.device_id);
      } catch (notifyError) {
        logger.error('Failed to notify waitlist, but loan return succeeded', notifyError, {
          loanId,
          deviceId: loanWithReservation.device_id,
        });
        // Continue - this is a non-critical operation
      }

      logger.info('Loan returned successfully', { 
        loanId,
        reservationId: loanWithReservation.reservation_id,
        deviceId: loanWithReservation.device_id,
      });
      
      return ResponseHelper.success(
        { message: 'Device returned and next user notified.' },
        'Loan returned successfully'
      );
    } catch (error) {
      logger.error('returnLoan failed', error, { loanId });
      return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to return loan');
    }
  }

  async getAllLoans(options: {
    page?: number;
    pageSize?: number;
  } = {}): Promise<ApiResponse<PaginatedResult<LoanWithDetailsDto> | null>> {
    logger.debug('getAllLoans called', { options });
    
    try {
      const page = options.page || 1;
      const pageSize = options.pageSize || 10;

      // Get total count
      const totalCount = await loanRepo.countAll();

      // Get paginated results with details
      const results = await loanRepo.findAllWithDetails({ page, pageSize });

      const loans: LoanWithDetailsDto[] = results.map((row: any) => ({
        loanId: row.loan_id,
        reservationId: row.reservation_id,
        collectedAt: row.collected_at,
        returnedAt: row.returned_at || null,
        reservation: {
          reservedAt: row.reserved_at,
          dueDate: row.due_date,
          status: row.status,
        },
        user: {
          userId: row.user_id,
          email: row.email,
          firstName: row.first_name,
          lastName: row.last_name,
          role: row.role as 'student' | 'staff',
        },
        device: {
          deviceId: row.device_id,
          brand: row.brand,
          model: row.model,
          category: row.category,
        },
        inventory: {
          inventoryId: row.inventory_id,
          serialNumber: row.serial_number,
          isAvailable: row.is_available,
        },
      }));

      const totalPages = Math.ceil(totalCount / pageSize);

      const result: PaginatedResult<LoanWithDetailsDto> = {
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
        data: loans,
      };

      logger.info('Loans retrieved successfully', {
        count: loans.length,
        totalCount,
        page,
        pageSize,
      });

      return ResponseHelper.success(result, 'Loans retrieved successfully');
    } catch (error) {
      logger.error('getAllLoans failed', error, { options });
      return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to retrieve loans');
    }
  }

  async getLoansByUserId(userId: string, options: {
    page?: number;
    pageSize?: number;
  } = {}): Promise<ApiResponse<PaginatedResult<LoanWithDetailsDto> | null>> {
    logger.debug('getLoansByUserId called', { userId, options });
    
    try {
      if (!userId) {
        logger.warn('getLoansByUserId validation failed: userId is required');
        return ResponseHelper.validationError('User ID is required');
      }

      const page = options.page || 1;
      const pageSize = options.pageSize || 10;

      // Get total count
      const totalCount = await loanRepo.countByUserId(userId);

      // Get paginated results with details
      const results = await loanRepo.findByUserIdWithPagination(userId, { page, pageSize });

      const loans: LoanWithDetailsDto[] = results.map((row: any) => ({
        loanId: row.loan_id,
        reservationId: row.reservation_id,
        collectedAt: row.collected_at,
        returnedAt: row.returned_at || null,
        reservation: {
          reservedAt: row.reserved_at,
          dueDate: row.due_date,
          status: row.status,
        },
        user: {
          userId: row.user_id,
          email: row.email,
          firstName: row.first_name,
          lastName: row.last_name,
          role: row.role as 'student' | 'staff',
        },
        device: {
          deviceId: row.device_id,
          brand: row.brand,
          model: row.model,
          category: row.category,
        },
        inventory: {
          inventoryId: row.inventory_id,
          serialNumber: row.serial_number,
          isAvailable: row.is_available,
        },
      }));

      const totalPages = Math.ceil(totalCount / pageSize);

      const result: PaginatedResult<LoanWithDetailsDto> = {
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
        data: loans,
      };

      logger.info('Loans by user retrieved successfully', {
        userId,
        count: loans.length,
        totalCount,
        page,
        pageSize,
      });

      return ResponseHelper.success(result, 'Loans retrieved successfully');
    } catch (error) {
      logger.error('getLoansByUserId failed', error, { userId, options });
      return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to retrieve loans');
    }
  }
}

export default new LoanService();

