import { injectable } from 'tsyringe';
import waitlistRepository from '../repository/waitlist.repository';
import emailService from './email.service';
import { JoinWaitlistResponseDto, WaitlistWithDetailsDto, PaginatedResult } from '../dtos/waitlist.dto';
import { ApiResponse, ResponseHelper } from '../dtos/response.dto';
import { logger } from '../utils/logger';
import db from '../../database/connection';
import { WaitlistTable } from '../model/waitlist.model';
import WaitlistFactory from '../factory/waitlist.factory';
import deviceRepository from '../repository/device.repository';
import userRepository from '../repository/user.repository';

@injectable()
export class WaitlistService {
  async joinWaitlist(userId: string, deviceId: string): Promise<ApiResponse<JoinWaitlistResponseDto | null>> {
    logger.debug('joinWaitlist called', { userId, deviceId });
    try {
      if (!userId) {
        logger.warn('joinWaitlist validation failed: userId is required');
        return ResponseHelper.validationError('User ID is required');
      }

      if (!deviceId) {
        logger.warn('joinWaitlist validation failed: deviceId is required');
        return ResponseHelper.validationError('Device ID is required');
      }

      // Check if user is already on waitlist
      const userWaitlists = await waitlistRepository.findByUser(userId);
      const existing = userWaitlists.find(w => w.deviceId === deviceId);
      if (existing) {
        logger.warn('joinWaitlist: user already on waitlist', { userId, deviceId });
        return ResponseHelper.error('You are already on the waitlist for this device');
      }

      // Add to waitlist
      const waitlistEntry = await waitlistRepository.create(userId, deviceId);

      // Get position in queue
      const position = await waitlistRepository.getPosition(deviceId, waitlistEntry.addedAt);

      const response: JoinWaitlistResponseDto = {
        waitlistId: waitlistEntry.waitlistId,
        userId: waitlistEntry.userId,
        deviceId: waitlistEntry.deviceId,
        addedAt: waitlistEntry.addedAt,
        position,
      };

      logger.info('User joined waitlist successfully', { userId, deviceId, position });
      return ResponseHelper.success(response, 'Added to waitlist successfully');
    } catch (error) {
      logger.error('joinWaitlist failed', error, { userId, deviceId });
      return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to join waitlist');
    }
  }

  async removeFromWaitlist(userId: string, deviceId: string): Promise<ApiResponse<null>> {
    logger.debug('removeFromWaitlist called', { userId, deviceId });
    try {
      if (!userId) {
        logger.warn('removeFromWaitlist validation failed: userId is required');
        return ResponseHelper.validationError('User ID is required');
      }

      if (!deviceId) {
        logger.warn('removeFromWaitlist validation failed: deviceId is required');
        return ResponseHelper.validationError('Device ID is required');
      }

      const removed = await waitlistRepository.remove(userId, deviceId);
      if (!removed) {
        logger.warn('removeFromWaitlist: user not on waitlist', { userId, deviceId });
        return ResponseHelper.notFound('You are not on this waitlist');
      }

      logger.info('User removed from waitlist successfully', { userId, deviceId });
      return ResponseHelper.success(null, 'Removed from waitlist successfully');
    } catch (error) {
      logger.error('removeFromWaitlist failed', error, { userId, deviceId });
      return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to remove from waitlist');
    }
  }

  async notifyNextUser(deviceId: string): Promise<void> {
    logger.debug('notifyNextUser called', { deviceId });
    try {
      // Find next user in FIFO order
      const nextUser = await waitlistRepository.getNextUser(deviceId);

      if (!nextUser) {
        logger.debug('notifyNextUser: no users on waitlist', { deviceId });
        return;
      }

      // Get device information for email
      const device = await deviceRepository.findById(deviceId);
      if (!device) {
        logger.warn('notifyNextUser: device not found', { deviceId });
        return;
      }

      // Get user information to get actual email
      const user = await userRepository.findById(nextUser.userId);
      if (!user) {
        logger.warn('notifyNextUser: user not found', { userId: nextUser.userId });
        return;
      }

      const userEmail = user.email;

      try {
        // Send email with circuit breaker and retry logic
        await emailService.sendNotificationEmail(
          nextUser.userId,
          userEmail,
          {
            brand: device.brand,
            model: device.model,
          }
        );

        // Mark as notified only if email was sent successfully
        await waitlistRepository.markAsNotified(nextUser.waitlistId);

        logger.info('User notified successfully', {
          userId: nextUser.userId,
          deviceId: nextUser.deviceId,
          waitlistId: nextUser.waitlistId,
        });
      } catch (emailError) {
        // Graceful degradation: Log error but don't mark as notified
        // This allows the system to retry notification later
        logger.error('Email notification failed, will retry later', emailError, {
          userId: nextUser.userId,
          deviceId: nextUser.deviceId,
          waitlistId: nextUser.waitlistId,
        });
        // Don't mark as notified, so it can be retried
        // In a production system, you might want to implement a retry queue here
      }
    } catch (error) {
      logger.error('notifyNextUser failed', error, { deviceId });
      // Don't throw error, just log it so it doesn't break the main flow
      // This is graceful degradation - the system continues to function
    }
  }

  async getAllWaitlist(options: {
    page?: number;
    pageSize?: number;
  } = {}): Promise<ApiResponse<PaginatedResult<WaitlistWithDetailsDto> | null>> {
    logger.debug('getAllWaitlist called', { options });
    try {
      // Get total count
      const totalCountResult = await db('waitlist')
        .join('users', 'waitlist.user_id', 'users.user_id')
        .join('devices', 'waitlist.device_id', 'devices.device_id')
        .where('users.is_deleted', false)
        .where('devices.is_deleted', false)
        .count('* as count')
        .first();
      const totalCount = parseInt((totalCountResult as { count: string }).count, 10);

      // Get paginated results with joins
      const results = await waitlistRepository.findAllWithDetails(options);

      const waitlists: WaitlistWithDetailsDto[] = results.map((row: any) => {
        const waitlist: WaitlistTable = {
          waitlist_id: row.waitlist_id,
          user_id: row.user_id,
          device_id: row.device_id,
          added_at: row.added_at,
          is_notified: row.is_notified,
          notified_at: row.notified_at,
        };

        const waitlistDto = WaitlistFactory.toDto(waitlist);

        return {
          ...waitlistDto,
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
        };
      });

      const page = options.page || 1;
      const pageSize = options.pageSize || 10;
      const totalPages = Math.ceil(totalCount / pageSize);

      const result: PaginatedResult<WaitlistWithDetailsDto> = {
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
        data: waitlists,
      };

      logger.info('Waitlist retrieved successfully', {
        count: waitlists.length,
        totalCount: result.pagination.totalCount,
        page: result.pagination.page,
      });
      return ResponseHelper.success(result, 'Waitlist retrieved successfully');
    } catch (error) {
      logger.error('getAllWaitlist failed', error, { options });
      return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to retrieve waitlist');
    }
  }

  async getWaitlistByUserId(userId: string): Promise<ApiResponse<WaitlistWithDetailsDto[] | null>> {
    logger.debug('getWaitlistByUserId called', { userId });
    try {
      if (!userId) {
        logger.warn('getWaitlistByUserId validation failed: userId is required');
        return ResponseHelper.validationError('User ID is required');
      }

      const results = await waitlistRepository.findByUserIdWithDetails(userId);

      const waitlists: WaitlistWithDetailsDto[] = results.map((row: any) => {
        const waitlist: WaitlistTable = {
          waitlist_id: row.waitlist_id,
          user_id: row.user_id,
          device_id: row.device_id,
          added_at: row.added_at,
          is_notified: row.is_notified,
          notified_at: row.notified_at,
        };

        const waitlistDto = WaitlistFactory.toDto(waitlist);

        return {
          ...waitlistDto,
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
        };
      });

      logger.info('Waitlist by user ID retrieved successfully', { userId, count: waitlists.length });
      return ResponseHelper.success(waitlists, 'Waitlist retrieved successfully');
    } catch (error) {
      logger.error('getWaitlistByUserId failed', error, { userId });
      return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to retrieve waitlist');
    }
  }

  async getWaitlistByDeviceId(deviceId: string): Promise<ApiResponse<WaitlistWithDetailsDto[] | null>> {
    logger.debug('getWaitlistByDeviceId called', { deviceId });
    try {
      if (!deviceId) {
        logger.warn('getWaitlistByDeviceId validation failed: deviceId is required');
        return ResponseHelper.validationError('Device ID is required');
      }

      const results = await waitlistRepository.findByDeviceIdWithDetails(deviceId);

      const waitlists: WaitlistWithDetailsDto[] = results.map((row: any) => {
        const waitlist: WaitlistTable = {
          waitlist_id: row.waitlist_id,
          user_id: row.user_id,
          device_id: row.device_id,
          added_at: row.added_at,
          is_notified: row.is_notified,
          notified_at: row.notified_at,
        };

        const waitlistDto = WaitlistFactory.toDto(waitlist);

        return {
          ...waitlistDto,
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
        };
      });

      logger.info('Waitlist by device ID retrieved successfully', { deviceId, count: waitlists.length });
      return ResponseHelper.success(waitlists, 'Waitlist retrieved successfully');
    } catch (error) {
      logger.error('getWaitlistByDeviceId failed', error, { deviceId });
      return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to retrieve waitlist');
    }
  }

  async getMyWaitlist(userId: string): Promise<ApiResponse<WaitlistWithDetailsDto[] | null>> {
    logger.debug('getMyWaitlist called', { userId });
    try {
      if (!userId) {
        logger.warn('getMyWaitlist validation failed: userId is required');
        return ResponseHelper.validationError('User ID is required');
      }

      const results = await waitlistRepository.findByUserIdWithDetails(userId);

      const waitlists: WaitlistWithDetailsDto[] = results.map((row: any) => {
        const waitlist: WaitlistTable = {
          waitlist_id: row.waitlist_id,
          user_id: row.user_id,
          device_id: row.device_id,
          added_at: row.added_at,
          is_notified: row.is_notified,
          notified_at: row.notified_at,
        };

        const waitlistDto = WaitlistFactory.toDto(waitlist);

        return {
          ...waitlistDto,
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
        };
      });

      logger.info('My waitlist retrieved successfully', { userId, count: waitlists.length });
      return ResponseHelper.success(waitlists, 'My waitlist retrieved successfully');
    } catch (error) {
      logger.error('getMyWaitlist failed', error, { userId });
      return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to retrieve waitlist');
    }
  }
}

export default new WaitlistService();

