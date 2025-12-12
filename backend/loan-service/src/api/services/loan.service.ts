import { LoanRepository } from "../repository/loan.repository";
import { ReservationRepository } from "../repository/reservation.repository";
import { InventoryRepository } from "../repository/inventory.repository";
import { WaitlistNotifyService } from "./waitlist-notify.service";
import { logger } from "../utils/logger";
import { ResponseHelper, ApiResponse } from "../dtos/response.dto";
import { LoanTable } from "../model/loan.model";

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
}

export default new LoanService();

