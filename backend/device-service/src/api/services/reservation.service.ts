import { injectable } from 'tsyringe';
import reservationRepository from '../repository/reservation.repository';
import waitlistService from './waitlist.service';
import { ReservationDto, ReservationWithDetailsDto, PaginatedResult } from '../dtos/reservation.dto';
import { ApiResponse, ResponseHelper } from '../dtos/response.dto';
import { logger } from '../utils/logger';
import { measureExecutionTime } from '../utils/metrics';
import db from '../../database/connection';
import ReservationFactory from '../factory/reservation.factory';
import { ReservationTable } from '../model/reservation.model';

@injectable()
export class ReservationService {
  async reserveDevice(userId: string, deviceId: string): Promise<ApiResponse<ReservationDto | null>> {
    logger.debug('reserveDevice called', { userId, deviceId });

    return measureExecutionTime(
      'reserveDevice',
      async () => {
        const trx = await db.transaction();

        try {
          if (!userId) {
            await trx.rollback();
            logger.warn('reserveDevice validation failed: userId is required');
            return ResponseHelper.validationError('User ID is required');
          }

          if (!deviceId) {
            await trx.rollback();
            logger.warn('reserveDevice validation failed: deviceId is required');
            return ResponseHelper.validationError('Device ID is required');
          }

          // 1. Lock and get one available inventory unit
          const inventoryId = await reservationRepository.lockAndGetAvailableInventory(trx, deviceId);

          // 2. If no inventory is available → return error (controller will handle 409)
          if (!inventoryId) {
            await trx.rollback();
            logger.warn('reserveDevice: No available inventory', { userId, deviceId });
            return ResponseHelper.error('No available devices for this model. Please join the waitlist.');
          }

          // 3. Mark the selected physical unit as unavailable
          await reservationRepository.markInventoryAsUnavailable(trx, inventoryId);

          // 4. Calculate due date (2 days from now)
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 2);

          // 5. Create reservation
          const reservationDto = await reservationRepository.createReservation(trx, userId, deviceId, inventoryId, dueDate);

          // 6. Commit the transaction
          await trx.commit();

          logger.info('Reservation created successfully', {
            reservationId: reservationDto.reservationId,
            userId,
            deviceId,
            inventoryId,
          });

          return ResponseHelper.success(reservationDto, 'Reservation successful.');
        } catch (error) {
          await trx.rollback();
          logger.error('reserveDevice failed', error, { userId, deviceId });
          return ResponseHelper.error(error instanceof Error ? error.message : 'Reservation failed due to server error.');
        }
      },
      { userId, deviceId }
    );
  }




  async getAllReservations(options: {
    page?: number;
    pageSize?: number;
  } = {}): Promise<ApiResponse<PaginatedResult<ReservationWithDetailsDto> | null>> {
    logger.debug('getAllReservations called', { options });
    try {
      // Get total count
      const totalCountResult = await db('reservations')
        .join('users', 'reservations.user_id', 'users.user_id')
        .join('devices', 'reservations.device_id', 'devices.device_id')
        .where('users.is_deleted', false)
        .where('devices.is_deleted', false)
        .count('* as count')
        .first();
      const totalCount = parseInt((totalCountResult as { count: string }).count, 10);

      // Get paginated results with joins
      const results = await reservationRepository.findAll(options);

      const reservations: ReservationWithDetailsDto[] = results.map((row: any) => {
        const reservation: ReservationTable = {
          reservation_id: row.reservation_id,
          user_id: row.user_id,
          device_id: row.device_id,
          inventory_id: row.inventory_id,
          reserved_at: row.reserved_at,
          due_date: row.due_date,
          status: row.status,
        };

        const reservationDto = ReservationFactory.toDto(reservation);

        return {
          ...reservationDto,
          user: {
            email: row.email,
            firstName: row.first_name,
            lastName: row.last_name,
            role: row.role,
          },
          device: {
            brand: row.brand,
            model: row.model,
            category: row.category,
          },
          inventory: {
            serialNumber: row.serial_number,
            isAvailable: row.is_available,
          },
        };
      });

      const page = options.page || 1;
      const pageSize = options.pageSize || 10;
      const totalPages = Math.ceil(totalCount / pageSize);

      const result: PaginatedResult<ReservationWithDetailsDto> = {
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
        data: reservations,
      };

      logger.info('Reservations retrieved successfully', {
        count: reservations.length,
        totalCount: result.pagination.totalCount,
        page: result.pagination.page,
      });
      return ResponseHelper.success(result, 'Reservations retrieved successfully');
    } catch (error) {
      logger.error('getAllReservations failed', error, { options });
      return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to retrieve reservations');
    }
  }




  async getReservationsByUserId(userId: string): Promise<ApiResponse<ReservationWithDetailsDto[] | null>> {
    logger.debug('getReservationsByUserId called', { userId });
    try {
      if (!userId) {
        logger.warn('getReservationsByUserId validation failed: userId is required');
        return ResponseHelper.validationError('User ID is required');
      }

      const results = await reservationRepository.findByUserId(userId);

      const reservations: ReservationWithDetailsDto[] = results.map((row: any) => {
        const reservation: ReservationTable = {
          reservation_id: row.reservation_id,
          user_id: row.user_id,
          device_id: row.device_id,
          inventory_id: row.inventory_id,
          reserved_at: row.reserved_at,
          due_date: row.due_date,
          status: row.status,
        };

        const reservationDto = ReservationFactory.toDto(reservation);

        return {
          ...reservationDto,
          user: {
            email: row.email,
            firstName: row.first_name,
            lastName: row.last_name,
            role: row.role,
          },
          device: {
            brand: row.brand,
            model: row.model,
            category: row.category,
          },
          inventory: {
            serialNumber: row.serial_number,
            isAvailable: row.is_available,
          },
        };
      });

      logger.info('Reservations by user retrieved successfully', { userId, count: reservations.length });
      return ResponseHelper.success(reservations, 'Reservations retrieved successfully');
    } catch (error) {
      logger.error('getReservationsByUserId failed', error, { userId });
      return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to retrieve reservations');
    }
  }

  async getMyReservations(userId: string, options: {
    page?: number;
    pageSize?: number;
  } = {}): Promise<ApiResponse<PaginatedResult<ReservationWithDetailsDto> | null>> {
    logger.debug('getMyReservations called', { userId, options });
    try {
      if (!userId) {
        logger.warn('getMyReservations validation failed: userId is required');
        return ResponseHelper.validationError('User ID is required');
      }

      const page = options.page || 1;
      const pageSize = options.pageSize || 10;

      // Get total count
      const totalCount = await reservationRepository.countByUserId(userId);

      // Get paginated results with joins
      const results = await reservationRepository.findByUserIdWithPagination(userId, { page, pageSize });

      const reservations: ReservationWithDetailsDto[] = results.map((row: any) => {
        const reservation: ReservationTable = {
          reservation_id: row.reservation_id,
          user_id: row.user_id,
          device_id: row.device_id,
          inventory_id: row.inventory_id,
          reserved_at: row.reserved_at,
          due_date: row.due_date,
          status: row.status,
        };

        const reservationDto = ReservationFactory.toDto(reservation);

        return {
          ...reservationDto,
          user: {
            email: row.email,
            firstName: row.first_name,
            lastName: row.last_name,
            role: row.role,
          },
          device: {
            brand: row.brand,
            model: row.model,
            category: row.category,
          },
          inventory: {
            serialNumber: row.serial_number,
            isAvailable: row.is_available,
          },
        };
      });

      const totalPages = Math.ceil(totalCount / pageSize);

      const result: PaginatedResult<ReservationWithDetailsDto> = {
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
        data: reservations,
      };

      logger.info('My reservations retrieved successfully', {
        userId,
        count: reservations.length,
        totalCount,
        page,
        pageSize,
      });

      return ResponseHelper.success(result, 'Reservations retrieved successfully');
    } catch (error) {
      logger.error('getMyReservations failed', error, { userId, options });
      return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to retrieve reservations');
    }
  }




  

  async getReservationsByDeviceId(deviceId: string): Promise<ApiResponse<ReservationWithDetailsDto[] | null>> {
    logger.debug('getReservationsByDeviceId called', { deviceId });
    try {
      if (!deviceId) {
        logger.warn('getReservationsByDeviceId validation failed: deviceId is required');
        return ResponseHelper.validationError('Device ID is required');
      }

      const results = await reservationRepository.findByDeviceId(deviceId);

      const reservations: ReservationWithDetailsDto[] = results.map((row: any) => {
        const reservation: ReservationTable = {
          reservation_id: row.reservation_id,
          user_id: row.user_id,
          device_id: row.device_id,
          inventory_id: row.inventory_id,
          reserved_at: row.reserved_at,
          due_date: row.due_date,
          status: row.status,
        };

        const reservationDto = ReservationFactory.toDto(reservation);

        return {
          ...reservationDto,
          user: {
            email: row.email,
            firstName: row.first_name,
            lastName: row.last_name,
            role: row.role,
          },
          device: {
            brand: row.brand,
            model: row.model,
            category: row.category,
          },
          inventory: {
            serialNumber: row.serial_number,
            isAvailable: row.is_available,
          },
        };
      });

      logger.info('Reservations by device retrieved successfully', { deviceId, count: reservations.length });
      return ResponseHelper.success(reservations, 'Reservations retrieved successfully');
    } catch (error) {
      logger.error('getReservationsByDeviceId failed', error, { deviceId });
      return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to retrieve reservations');
    }
  }

  async cancelReservation(userId: string, reservationId: string): Promise<ApiResponse<ReservationDto | null>> {
    logger.debug('cancelReservation called', { userId, reservationId });

    const trx = await db.transaction();

    try {
      if (!userId) {
        await trx.rollback();
        logger.warn('cancelReservation validation failed: userId is required');
        return ResponseHelper.validationError('User ID is required');
      }

      if (!reservationId) {
        await trx.rollback();
        logger.warn('cancelReservation validation failed: reservationId is required');
        return ResponseHelper.validationError('Reservation ID is required');
      }

      // 1. Find the reservation
      const reservation = await reservationRepository.findById(reservationId);
      if (!reservation) {
        await trx.rollback();
        logger.warn('cancelReservation: reservation not found', { reservationId });
        return ResponseHelper.notFound('Reservation not found');
      }

      // 2. Check if the user owns this reservation
      if (reservation.userId !== userId) {
        await trx.rollback();
        logger.warn('cancelReservation: user does not own this reservation', { userId, reservationId, reservationUserId: reservation.userId });
        return ResponseHelper.error('You can only cancel your own reservations');
      }

      // 3. Check if reservation is already cancelled
      if (reservation.status === 'cancelled') {
        await trx.rollback();
        logger.warn('cancelReservation: reservation already cancelled', { reservationId });
        return ResponseHelper.error('Reservation is already cancelled');
      }

      // 4. Update reservation status to cancelled
      const updatedReservation = await reservationRepository.updateStatus(trx, reservationId, 'cancelled');
      if (!updatedReservation) {
        await trx.rollback();
        logger.error('cancelReservation: failed to update reservation status', { reservationId });
        return ResponseHelper.error('Failed to cancel reservation');
      }

      // 5. Mark inventory as available again
      await reservationRepository.markInventoryAsAvailable(trx, reservation.inventoryId);

      // 6. Commit the transaction
      await trx.commit();

      logger.info('Reservation cancelled successfully', {
        reservationId: updatedReservation.reservationId,
        userId,
        inventoryId: reservation.inventoryId,
        deviceId: reservation.deviceId,
      });

      // 7. Notify next user in waitlist (after transaction commit, so it doesn't affect cancellation)
      await waitlistService.notifyNextUser(reservation.deviceId);

      return ResponseHelper.success(updatedReservation, 'Reservation cancelled successfully');
    } catch (error) {
      await trx.rollback();
      logger.error('cancelReservation failed', error, { userId, reservationId });
      return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to cancel reservation');
    }
  }
}

export default new ReservationService();

