import { injectable } from 'tsyringe';
import reservationRepository from '../repository/reservation.repository';
import { ReservationDto, ReservationWithDetailsDto, PaginatedResult } from '../dtos/reservation.dto';
import { ApiResponse, ResponseHelper } from '../dtos/response.dto';
import { logger } from '../utils/logger';
import db from '../../database/connection';
import ReservationFactory from '../factory/reservation.factory';
import DeviceFactory from '../factory/device.factory';
import DeviceInventoryFactory from '../factory/device-inventory.factory';
import { ReservationTable } from '../model/reservation.model';
import { DeviceTable } from '../model/device.model';
import { DeviceInventoryTable } from '../model/device-inventory.model';

@injectable()
export class ReservationService {
  async reserveDevice(userId: string, deviceId: string): Promise<ApiResponse<ReservationDto | null>> {
    logger.debug('reserveDevice called', { userId, deviceId });

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
  }




  async getAllReservations(options: {
    page?: number;
    pageSize?: number;
  } = {}): Promise<ApiResponse<PaginatedResult<ReservationDto> | null>> {
    logger.debug('getAllReservations called', { options });
    try {
      const result = await reservationRepository.findAll(options);
      logger.info('Reservations retrieved successfully', {
        count: result.data.length,
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

        const device: DeviceTable = {
          device_id: row.device_device_id,
          brand: row.brand,
          model: row.model,
          category: row.category,
          description: row.description,
          image_url: null,
          default_loan_duration_days: row.default_loan_duration_days,
          created_at: row.device_created_at,
          is_deleted: row.is_deleted,
        };

        const inventory: DeviceInventoryTable = {
          inventory_id: row.inventory_inventory_id,
          device_id: row.inventory_device_id,
          serial_number: row.serial_number,
          is_available: row.is_available,
          created_at: row.inventory_created_at,
        };

        const reservationDto = ReservationFactory.toDto(reservation);
        const deviceDto = DeviceFactory.toDto(device);
        const inventoryDto = DeviceInventoryFactory.toDto(inventory);

        return {
          ...reservationDto,
          device: deviceDto,
          inventory: inventoryDto,
        };
      });

      logger.info('Reservations by user retrieved successfully', { userId, count: reservations.length });
      return ResponseHelper.success(reservations, 'Reservations retrieved successfully');
    } catch (error) {
      logger.error('getReservationsByUserId failed', error, { userId });
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

        const device: DeviceTable = {
          device_id: row.device_device_id,
          brand: row.brand,
          model: row.model,
          category: row.category,
          description: row.description,
          image_url: null,
          default_loan_duration_days: row.default_loan_duration_days,
          created_at: row.device_created_at,
          is_deleted: row.is_deleted,
        };

        const inventory: DeviceInventoryTable = {
          inventory_id: row.inventory_inventory_id,
          device_id: row.inventory_device_id,
          serial_number: row.serial_number,
          is_available: row.is_available,
          created_at: row.inventory_created_at,
        };

        const reservationDto = ReservationFactory.toDto(reservation);
        const deviceDto = DeviceFactory.toDto(device);
        const inventoryDto = DeviceInventoryFactory.toDto(inventory);

        return {
          ...reservationDto,
          device: deviceDto,
          inventory: inventoryDto,
        };
      });

      logger.info('Reservations by device retrieved successfully', { deviceId, count: reservations.length });
      return ResponseHelper.success(reservations, 'Reservations retrieved successfully');
    } catch (error) {
      logger.error('getReservationsByDeviceId failed', error, { deviceId });
      return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to retrieve reservations');
    }
  }
}

export default new ReservationService();

