import { EmailNotificationService } from '../../api/services/email-notification.service';
import emailNotificationRepository from '../../api/repository/email-notification.repository';
import EmailNotificationFactory from '../../api/factory/email-notification.factory';
import { EmailNotificationTable } from '../../api/model/email-notification.model';
import { EmailNotificationDto } from '../../api/dtos/email-notification.dto';

// Mock dependencies
jest.mock('../../api/repository/email-notification.repository');
jest.mock('../../api/factory/email-notification.factory');

describe('EmailNotificationService - Unit Tests', () => {
  let emailNotificationService: EmailNotificationService;
  const mockEmailNotificationRepository = emailNotificationRepository as jest.Mocked<typeof emailNotificationRepository>;
  const mockEmailNotificationFactory = EmailNotificationFactory as jest.Mocked<typeof EmailNotificationFactory>;

  beforeEach(() => {
    emailNotificationService = new EmailNotificationService();
    jest.clearAllMocks();
  });

  describe('getEmailById', () => {
    const mockEmailId = 'email-123';
    const mockEmailTable: EmailNotificationTable = {
      email_id: 'email-123',
      user_id: 'user-123',
      email_address: 'user@example.com',
      subject: 'Test Subject',
      body: 'Test Body',
      status: 'sent',
      attempts: 1,
      error_message: null,
      sent_at: new Date(),
      is_read: false,
      created_at: new Date(),
    };
    const mockEmailDto: EmailNotificationDto = {
      emailId: 'email-123',
      userId: 'user-123',
      emailAddress: 'user@example.com',
      subject: 'Test Subject',
      body: 'Test Body',
      status: 'sent',
      attempts: 1,
      errorMessage: null,
      sentAt: new Date(),
      isRead: false,
      createdAt: new Date(),
    };

    it('should return email when found', async () => {
      mockEmailNotificationRepository.findById.mockResolvedValue(mockEmailTable);
      mockEmailNotificationFactory.toDto.mockReturnValue(mockEmailDto);

      const result = await emailNotificationService.getEmailById(mockEmailId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEmailDto);
      expect(mockEmailNotificationRepository.findById).toHaveBeenCalledWith(mockEmailId);
      expect(mockEmailNotificationFactory.toDto).toHaveBeenCalledWith(mockEmailTable);
    });

    it('should return not found when email does not exist', async () => {
      mockEmailNotificationRepository.findById.mockResolvedValue(null);

      const result = await emailNotificationService.getEmailById(mockEmailId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('05');
      expect(result.data).toBeNull();
      expect(mockEmailNotificationFactory.toDto).not.toHaveBeenCalled();
    });

    it('should return validation error when emailId is empty', async () => {
      const result = await emailNotificationService.getEmailById('');

      expect(result.success).toBe(false);
      expect(result.code).toBe('09');
      expect(mockEmailNotificationRepository.findById).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockEmailNotificationRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await emailNotificationService.getEmailById(mockEmailId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Database error');
    });
  });

  describe('getEmailsByUserId', () => {
    const mockUserId = 'user-123';
    const mockEmailTables: EmailNotificationTable[] = [
      {
        email_id: 'email-1',
        user_id: 'user-123',
        email_address: 'user@example.com',
        subject: 'Subject 1',
        body: 'Body 1',
        status: 'sent',
        attempts: 1,
        error_message: null,
        sent_at: new Date(),
        is_read: false,
        created_at: new Date(),
      },
      {
        email_id: 'email-2',
        user_id: 'user-123',
        email_address: 'user@example.com',
        subject: 'Subject 2',
        body: 'Body 2',
        status: 'sent',
        attempts: 1,
        error_message: null,
        sent_at: new Date(),
        is_read: true,
        created_at: new Date(),
      },
    ];
    const mockEmailDtos: EmailNotificationDto[] = [
      {
        emailId: 'email-1',
        userId: 'user-123',
        emailAddress: 'user@example.com',
        subject: 'Subject 1',
        body: 'Body 1',
        status: 'sent',
        attempts: 1,
        errorMessage: null,
        sentAt: new Date(),
        isRead: false,
        createdAt: new Date(),
      },
      {
        emailId: 'email-2',
        userId: 'user-123',
        emailAddress: 'user@example.com',
        subject: 'Subject 2',
        body: 'Body 2',
        status: 'sent',
        attempts: 1,
        errorMessage: null,
        sentAt: new Date(),
        isRead: true,
        createdAt: new Date(),
      },
    ];

    it('should return emails for user', async () => {
      mockEmailNotificationRepository.findByUserId.mockResolvedValue(mockEmailTables);
      mockEmailNotificationFactory.toDtoArray.mockReturnValue(mockEmailDtos);

      const result = await emailNotificationService.getEmailsByUserId(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEmailDtos);
      expect(mockEmailNotificationRepository.findByUserId).toHaveBeenCalledWith(mockUserId, {});
      expect(mockEmailNotificationFactory.toDtoArray).toHaveBeenCalledWith(mockEmailTables);
    });

    it('should return emails with isRead filter', async () => {
      const filteredTables = [mockEmailTables[0]];
      const filteredDtos = [mockEmailDtos[0]];

      mockEmailNotificationRepository.findByUserId.mockResolvedValue(filteredTables);
      mockEmailNotificationFactory.toDtoArray.mockReturnValue(filteredDtos);

      const result = await emailNotificationService.getEmailsByUserId(mockUserId, { isRead: false });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(filteredDtos);
      expect(mockEmailNotificationRepository.findByUserId).toHaveBeenCalledWith(mockUserId, { isRead: false });
    });

    it('should return emails with limit', async () => {
      const limitedTables = [mockEmailTables[0]];
      const limitedDtos = [mockEmailDtos[0]];

      mockEmailNotificationRepository.findByUserId.mockResolvedValue(limitedTables);
      mockEmailNotificationFactory.toDtoArray.mockReturnValue(limitedDtos);

      const result = await emailNotificationService.getEmailsByUserId(mockUserId, { limit: 1 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(limitedDtos);
      expect(mockEmailNotificationRepository.findByUserId).toHaveBeenCalledWith(mockUserId, { limit: 1 });
    });

    it('should return empty array when no emails found', async () => {
      mockEmailNotificationRepository.findByUserId.mockResolvedValue([]);
      mockEmailNotificationFactory.toDtoArray.mockReturnValue([]);

      const result = await emailNotificationService.getEmailsByUserId(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should return validation error when userId is empty', async () => {
      const result = await emailNotificationService.getEmailsByUserId('');

      expect(result.success).toBe(false);
      expect(result.code).toBe('09');
      expect(mockEmailNotificationRepository.findByUserId).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockEmailNotificationRepository.findByUserId.mockRejectedValue(new Error('Database error'));

      const result = await emailNotificationService.getEmailsByUserId(mockUserId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Database error');
    });
  });

  describe('markAsRead', () => {
    const mockEmailId = 'email-123';

    it('should mark email as read successfully', async () => {
      mockEmailNotificationRepository.markAsRead.mockResolvedValue(true);

      const result = await emailNotificationService.markAsRead(mockEmailId);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(mockEmailNotificationRepository.markAsRead).toHaveBeenCalledWith(mockEmailId);
    });

    it('should return not found when email does not exist', async () => {
      mockEmailNotificationRepository.markAsRead.mockResolvedValue(false);

      const result = await emailNotificationService.markAsRead(mockEmailId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('05');
      expect(result.data).toBeNull();
    });

    it('should return validation error when emailId is empty', async () => {
      const result = await emailNotificationService.markAsRead('');

      expect(result.success).toBe(false);
      expect(result.code).toBe('09');
      expect(mockEmailNotificationRepository.markAsRead).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockEmailNotificationRepository.markAsRead.mockRejectedValue(new Error('Database error'));

      const result = await emailNotificationService.markAsRead(mockEmailId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Database error');
    });
  });
});

