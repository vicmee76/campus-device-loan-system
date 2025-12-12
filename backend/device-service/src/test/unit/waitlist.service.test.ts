import { WaitlistService } from '../../api/services/waitlist.service';
import waitlistRepository from '../../api/repository/waitlist.repository';
import deviceRepository from '../../api/repository/device.repository';
import emailService from '../../api/services/email.service';
import { JoinWaitlistResponseDto, WaitlistDto } from '../../api/dtos/waitlist.dto';
import { DeviceDto } from '../../api/dtos/device.dto';

// Mock dependencies
jest.mock('../../api/repository/waitlist.repository');
jest.mock('../../api/repository/device.repository');
jest.mock('../../api/services/email.service');

describe('WaitlistService - Unit Tests', () => {
  let waitlistService: WaitlistService;
  const mockWaitlistRepository = waitlistRepository as jest.Mocked<typeof waitlistRepository>;
  const mockDeviceRepository = deviceRepository as jest.Mocked<typeof deviceRepository>;
  const mockEmailService = emailService as jest.Mocked<typeof emailService>;

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

    it('should notify next user successfully', async () => {
      mockWaitlistRepository.getNextUser.mockResolvedValue(mockWaitlistEntry);
      mockDeviceRepository.findById.mockResolvedValue(mockDevice);
      mockEmailService.sendNotificationEmail.mockResolvedValue();
      mockWaitlistRepository.markAsNotified.mockResolvedValue(mockWaitlistEntry);

      await waitlistService.notifyNextUser(mockDeviceId);

      expect(mockWaitlistRepository.getNextUser).toHaveBeenCalledWith(mockDeviceId);
      expect(mockEmailService.sendNotificationEmail).toHaveBeenCalled();
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
      mockEmailService.sendNotificationEmail.mockRejectedValue(new Error('Email error'));

      await waitlistService.notifyNextUser(mockDeviceId);

      expect(mockEmailService.sendNotificationEmail).toHaveBeenCalled();
      expect(mockWaitlistRepository.markAsNotified).not.toHaveBeenCalled();
    });
  });
});

