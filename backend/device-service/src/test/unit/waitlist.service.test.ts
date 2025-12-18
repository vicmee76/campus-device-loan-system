/// <reference types="jest" />
import { WaitlistService } from '../../api/services/waitlist.service';
import waitlistRepository from '../../api/repository/waitlist.repository';
import deviceRepository from '../../api/repository/device.repository';
import userRepository from '../../api/repository/user.repository';
import emailService from '../../api/services/email.service';
import emailNotificationRepository from '../../api/repository/email-notification.repository';
import { JoinWaitlistResponseDto, WaitlistDto } from '../../api/dtos/waitlist.dto';
import { DeviceDto } from '../../api/dtos/device.dto';
import { UserDto } from '../../api/dtos/user.dto';
import db from '../../database/connection';

// Mock dependencies
jest.mock('../../api/repository/waitlist.repository');
jest.mock('../../api/repository/device.repository');
jest.mock('../../api/repository/user.repository');
jest.mock('../../api/services/email.service');
jest.mock('../../api/repository/email-notification.repository');
jest.mock('../../database/connection');

describe('WaitlistService - Unit Tests', () => {
  let waitlistService: WaitlistService;
  const mockWaitlistRepository = waitlistRepository as jest.Mocked<typeof waitlistRepository>;
  const mockDeviceRepository = deviceRepository as jest.Mocked<typeof deviceRepository>;
  const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>;
  const mockEmailService = emailService as jest.Mocked<typeof emailService>;
  const mockEmailNotificationRepository = emailNotificationRepository as jest.Mocked<typeof emailNotificationRepository>;
  const mockDb = db as jest.MockedFunction<any>;

  beforeEach(() => {
    waitlistService = new WaitlistService();
    jest.clearAllMocks();
  });

  describe('joinWaitlist', () => {
    const mockUserId = 'user-123';
    const mockDeviceId = 'device-123';

    const mockWaitlistEntry: WaitlistDto = {
      waitlistId: 'waitlist-123',
      userId: mockUserId,
      deviceId: mockDeviceId,
      addedAt: new Date(),
      isNotified: false,
      notifiedAt: null,
    };

    it('should join waitlist successfully', async () => {
      mockWaitlistRepository.findByUser.mockResolvedValue([]);
      mockWaitlistRepository.create.mockResolvedValue(mockWaitlistEntry);
      mockWaitlistRepository.getPosition.mockResolvedValue(1);

      const result = await waitlistService.joinWaitlist(mockUserId, mockDeviceId);

      expect(result.success).toBe(true);
      expect(result.data?.waitlistId).toBe(mockWaitlistEntry.waitlistId);
      expect(result.data?.position).toBe(1);
      expect(mockWaitlistRepository.create).toHaveBeenCalledWith(mockUserId, mockDeviceId);
    });

    it('should return error when user already on waitlist', async () => {
      mockWaitlistRepository.findByUser.mockResolvedValue([mockWaitlistEntry]);

      const result = await waitlistService.joinWaitlist(mockUserId, mockDeviceId);

      expect(result.success).toBe(false);
      expect(mockWaitlistRepository.create).not.toHaveBeenCalled();
    });

    it('should return validation error when userId is missing', async () => {
      const result = await waitlistService.joinWaitlist('', mockDeviceId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('09');
    });

    it('should return validation error when deviceId is missing', async () => {
      const result = await waitlistService.joinWaitlist(mockUserId, '');

      expect(result.success).toBe(false);
      expect(result.code).toBe('09');
    });

    it('should handle errors gracefully', async () => {
      mockWaitlistRepository.findByUser.mockRejectedValue(new Error('Database error'));

      const result = await waitlistService.joinWaitlist(mockUserId, mockDeviceId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('06');
    });
  });

  describe('removeFromWaitlist', () => {
    const mockUserId = 'user-123';
    const mockDeviceId = 'device-123';

    it('should remove from waitlist successfully', async () => {
      mockWaitlistRepository.remove.mockResolvedValue(true);

      const result = await waitlistService.removeFromWaitlist(mockUserId, mockDeviceId);

      expect(result.success).toBe(true);
      expect(mockWaitlistRepository.remove).toHaveBeenCalledWith(mockUserId, mockDeviceId);
    });

    it('should return not found when user not on waitlist', async () => {
      mockWaitlistRepository.remove.mockResolvedValue(false);

      const result = await waitlistService.removeFromWaitlist(mockUserId, mockDeviceId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('05');
    });

    it('should return validation error when userId is missing', async () => {
      const result = await waitlistService.removeFromWaitlist('', mockDeviceId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('09');
    });

    it('should return validation error when deviceId is missing', async () => {
      const result = await waitlistService.removeFromWaitlist(mockUserId, '');

      expect(result.success).toBe(false);
      expect(result.code).toBe('09');
    });

    it('should handle errors gracefully', async () => {
      mockWaitlistRepository.remove.mockRejectedValue(new Error('Database error'));

      const result = await waitlistService.removeFromWaitlist(mockUserId, mockDeviceId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('06');
    });
  });

  describe('notifyNextUser', () => {
    const mockDeviceId = 'device-123';

    const mockWaitlistEntry: WaitlistDto = {
      waitlistId: 'waitlist-123',
      userId: 'user-123',
      deviceId: mockDeviceId,
      addedAt: new Date(),
      isNotified: false,
      notifiedAt: null,
    };

    const mockDevice: DeviceDto = {
      deviceId: mockDeviceId,
      brand: 'Apple',
      model: 'MacBook Pro',
      category: 'Laptop',
      description: null,
      defaultLoanDurationDays: 2,
      createdAt: new Date(),
      isDeleted: false,
    };

    const mockUser: UserDto = {
      userId: 'user-123',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'student',
      isActive: true,
      isDeleted: false,
      createdAt: new Date(),
    };

    it('should notify next user successfully', async () => {
      mockWaitlistRepository.getNextUser.mockResolvedValue(mockWaitlistEntry);
      mockDeviceRepository.findById.mockResolvedValue(mockDevice);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockEmailService.sendNotificationEmail.mockResolvedValue();
      mockWaitlistRepository.markAsNotified.mockResolvedValue(mockWaitlistEntry);

      await waitlistService.notifyNextUser(mockDeviceId);

      expect(mockWaitlistRepository.getNextUser).toHaveBeenCalledWith(mockDeviceId);
      expect(mockDeviceRepository.findById).toHaveBeenCalledWith(mockDeviceId);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockWaitlistEntry.userId);
      expect(mockEmailService.sendNotificationEmail).toHaveBeenCalledWith(
        mockWaitlistEntry.userId,
        mockUser.email,
        {
          brand: mockDevice.brand,
          model: mockDevice.model,
        }
      );
      expect(mockWaitlistRepository.markAsNotified).toHaveBeenCalledWith(mockWaitlistEntry.waitlistId);
    });

    it('should not notify when no users on waitlist', async () => {
      mockWaitlistRepository.getNextUser.mockResolvedValue(null);

      await waitlistService.notifyNextUser(mockDeviceId);

      expect(mockEmailService.sendNotificationEmail).not.toHaveBeenCalled();
      expect(mockWaitlistRepository.markAsNotified).not.toHaveBeenCalled();
    });

    it('should not mark as notified when email fails', async () => {
      mockWaitlistRepository.getNextUser.mockResolvedValue(mockWaitlistEntry);
      mockDeviceRepository.findById.mockResolvedValue(mockDevice);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockEmailService.sendNotificationEmail.mockRejectedValue(new Error('Email error'));

      await waitlistService.notifyNextUser(mockDeviceId);

      expect(mockEmailService.sendNotificationEmail).toHaveBeenCalled();
      expect(mockWaitlistRepository.markAsNotified).not.toHaveBeenCalled();
    });

    it('should handle device not found error gracefully', async () => {
      mockWaitlistRepository.getNextUser.mockResolvedValue(mockWaitlistEntry);
      mockDeviceRepository.findById.mockResolvedValue(null);

      await waitlistService.notifyNextUser(mockDeviceId);

      expect(mockEmailService.sendNotificationEmail).not.toHaveBeenCalled();
      expect(mockWaitlistRepository.markAsNotified).not.toHaveBeenCalled();
    });

    it('should handle user not found error gracefully', async () => {
      mockWaitlistRepository.getNextUser.mockResolvedValue(mockWaitlistEntry);
      mockDeviceRepository.findById.mockResolvedValue(mockDevice);
      mockUserRepository.findById.mockResolvedValue(null);

      await waitlistService.notifyNextUser(mockDeviceId);

      expect(mockEmailService.sendNotificationEmail).not.toHaveBeenCalled();
      expect(mockWaitlistRepository.markAsNotified).not.toHaveBeenCalled();
    });

    it('should handle general errors gracefully', async () => {
      mockWaitlistRepository.getNextUser.mockRejectedValue(new Error('Database error'));

      await waitlistService.notifyNextUser(mockDeviceId);

      expect(mockEmailService.sendNotificationEmail).not.toHaveBeenCalled();
    });
  });

  describe('getAllWaitlist', () => {
    const mockResults = [
      {
        waitlist_id: 'waitlist-1',
        user_id: 'user-1',
        device_id: 'device-1',
        added_at: new Date(),
        is_notified: false,
        notified_at: null,
        email: 'user1@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'student',
        brand: 'Apple',
        model: 'MacBook Pro',
        category: 'laptop',
      },
    ];

    it('should return paginated waitlist successfully', async () => {
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        join: jest.fn().mockReturnThis(),
        count: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ count: '1' }),
      };
      const db = require('../../database/connection').default;
      db.mockReturnValue(mockQuery);
      mockWaitlistRepository.findAllWithDetails.mockResolvedValue(mockResults);

      const result = await waitlistService.getAllWaitlist({ page: 1, pageSize: 10 });

      expect(result.success).toBe(true);
      expect(result.data?.data).toHaveLength(1);
      expect(result.data?.pagination.totalCount).toBe(1);
    });

    it('should use default pagination when not provided', async () => {
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        join: jest.fn().mockReturnThis(),
        count: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ count: '0' }),
      };
      mockDb.mockReturnValue(mockQuery);
      mockWaitlistRepository.findAllWithDetails.mockResolvedValue([]);

      const result = await waitlistService.getAllWaitlist();

      expect(result.success).toBe(true);
      expect(result.data?.pagination.page).toBe(1);
      expect(result.data?.pagination.pageSize).toBe(10);
    });

    it('should handle errors gracefully', async () => {
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        join: jest.fn().mockReturnThis(),
        count: jest.fn().mockReturnThis(),
        first: jest.fn().mockRejectedValue(new Error('Database error')),
      };
      mockDb.mockReturnValue(mockQuery);

      const result = await waitlistService.getAllWaitlist();

      expect(result.success).toBe(false);
      expect(result.code).toBe('06');
    });
  });

  describe('getWaitlistByUserId', () => {
    const mockUserId = 'user-123';
    const mockResults = [
      {
        waitlist_id: 'waitlist-1',
        user_id: mockUserId,
        device_id: 'device-1',
        added_at: new Date(),
        is_notified: false,
        notified_at: null,
        email: 'user1@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'student',
        brand: 'Apple',
        model: 'MacBook Pro',
        category: 'laptop',
      },
    ];

    it('should return waitlist for user successfully', async () => {
      mockWaitlistRepository.findByUserIdWithDetails.mockResolvedValue(mockResults);

      const result = await waitlistService.getWaitlistByUserId(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(mockWaitlistRepository.findByUserIdWithDetails).toHaveBeenCalledWith(mockUserId);
    });

    it('should return validation error when userId is missing', async () => {
      const result = await waitlistService.getWaitlistByUserId('');

      expect(result.success).toBe(false);
      expect(result.code).toBe('09');
    });

    it('should handle errors gracefully', async () => {
      mockWaitlistRepository.findByUserIdWithDetails.mockRejectedValue(new Error('Database error'));

      const result = await waitlistService.getWaitlistByUserId(mockUserId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('06');
    });
  });

  describe('getWaitlistByDeviceId', () => {
    const mockDeviceId = 'device-123';
    const mockResults = [
      {
        waitlist_id: 'waitlist-1',
        user_id: 'user-1',
        device_id: mockDeviceId,
        added_at: new Date(),
        is_notified: false,
        notified_at: null,
        email: 'user1@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'student',
        brand: 'Apple',
        model: 'MacBook Pro',
        category: 'laptop',
      },
    ];

    it('should return waitlist for device successfully', async () => {
      mockWaitlistRepository.findByDeviceIdWithDetails.mockResolvedValue(mockResults);

      const result = await waitlistService.getWaitlistByDeviceId(mockDeviceId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(mockWaitlistRepository.findByDeviceIdWithDetails).toHaveBeenCalledWith(mockDeviceId);
    });

    it('should return validation error when deviceId is missing', async () => {
      const result = await waitlistService.getWaitlistByDeviceId('');

      expect(result.success).toBe(false);
      expect(result.code).toBe('09');
    });

    it('should handle errors gracefully', async () => {
      mockWaitlistRepository.findByDeviceIdWithDetails.mockRejectedValue(new Error('Database error'));

      const result = await waitlistService.getWaitlistByDeviceId(mockDeviceId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('06');
    });
  });

  describe('getMyWaitlist', () => {
    const mockUserId = 'user-123';
    const mockResults = [
      {
        waitlist_id: 'waitlist-1',
        user_id: mockUserId,
        device_id: 'device-1',
        added_at: new Date(),
        is_notified: false,
        notified_at: null,
        email: 'user1@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'student',
        brand: 'Apple',
        model: 'MacBook Pro',
        category: 'laptop',
      },
    ];

    it('should return my waitlist successfully', async () => {
      mockWaitlistRepository.findByUserIdWithDetails.mockResolvedValue(mockResults);

      const result = await waitlistService.getMyWaitlist(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(mockWaitlistRepository.findByUserIdWithDetails).toHaveBeenCalledWith(mockUserId);
    });

    it('should return validation error when userId is missing', async () => {
      const result = await waitlistService.getMyWaitlist('');

      expect(result.success).toBe(false);
      expect(result.code).toBe('09');
    });

    it('should handle errors gracefully', async () => {
      mockWaitlistRepository.findByUserIdWithDetails.mockRejectedValue(new Error('Database error'));

      const result = await waitlistService.getMyWaitlist(mockUserId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('06');
    });
  });
});

