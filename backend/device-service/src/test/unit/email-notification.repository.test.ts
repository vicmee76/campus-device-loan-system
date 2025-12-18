import { EmailNotificationRepository } from '../../api/repository/email-notification.repository';
import db from '../../database/connection';
import { EmailNotificationTable } from '../../api/model/email-notification.model';
import { CreateEmailNotificationDto } from '../../api/dtos/email-notification.dto';

jest.mock('../../database/connection');

describe('EmailNotificationRepository', () => {
  let repository: EmailNotificationRepository;
  let mockQuery: any;
  let mockDb: jest.MockedFunction<any>;

  const createThenable = (value: any) => {
    const thenable = {
      insert: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      first: jest.fn(),
      then: jest.fn((resolve) => Promise.resolve(value).then(resolve)),
      catch: jest.fn(),
    };
    return thenable;
  };

  beforeEach(() => {
    repository = new EmailNotificationRepository();
    mockQuery = createThenable([]);
    mockDb = db as jest.MockedFunction<any>;
    mockDb.mockReturnValue(mockQuery);
    (db.fn as any) = { now: jest.fn() };
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return email notification table', async () => {
      const createData: CreateEmailNotificationDto = {
        userId: 'user-123',
        emailAddress: 'user@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
      };

      const mockEmail: EmailNotificationTable = {
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

      const insertQuery = createThenable([mockEmail]);
      insertQuery.returning.mockReturnValue(insertQuery);
      mockQuery.insert.mockReturnValue(insertQuery);

      const result = await repository.create(createData, 'sent');

      const insertCall = mockQuery.insert.mock.calls[0][0];
      expect(insertCall.user_id).toBe('user-123');
      expect(insertCall.email_address).toBe('user@example.com');
      expect(insertCall.subject).toBe('Test Subject');
      expect(insertCall.body).toBe('Test Body');
      expect(insertCall.status).toBe('sent');
      expect(insertCall.attempts).toBe(1);
      expect(insertCall.error_message).toBeNull();
      expect(insertCall.is_read).toBe(false);
      // sent_at and created_at are functions (db.fn.now())
      expect(insertCall.sent_at).toBe(db.fn.now());
      expect(insertCall.created_at).toBe(db.fn.now());
      expect(insertQuery.returning).toHaveBeenCalledWith('*');
      expect(result).toEqual(mockEmail);
    });

    it('should create with failed status and error message', async () => {
      const createData: CreateEmailNotificationDto = {
        userId: 'user-456',
        emailAddress: 'user2@example.com',
        subject: 'Failed Subject',
        body: 'Failed Body',
      };

      const mockEmail: EmailNotificationTable = {
        email_id: 'email-456',
        user_id: 'user-456',
        email_address: 'user2@example.com',
        subject: 'Failed Subject',
        body: 'Failed Body',
        status: 'failed',
        attempts: 1,
        error_message: 'Connection error',
        sent_at: null,
        is_read: false,
        created_at: new Date(),
      };

      const insertQuery = createThenable([mockEmail]);
      insertQuery.returning.mockReturnValue(insertQuery);
      mockQuery.insert.mockReturnValue(insertQuery);

      const result = await repository.create(createData, 'failed', 'Connection error');

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          error_message: 'Connection error',
          sent_at: null,
        })
      );
      expect(result).toEqual(mockEmail);
    });
  });

  describe('findById', () => {
    it('should return email notification table when exists', async () => {
      const mockEmail: EmailNotificationTable = {
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

      const findQuery = createThenable(mockEmail);
      findQuery.first.mockResolvedValue(mockEmail);
      mockQuery.where.mockReturnValue(findQuery);

      const result = await repository.findById('email-123');

      expect(mockQuery.where).toHaveBeenCalledWith('email_id', 'email-123');
      expect(findQuery.first).toHaveBeenCalled();
      expect(result).toEqual(mockEmail);
    });

    it('should return null when email does not exist', async () => {
      const findQuery = createThenable(null);
      findQuery.first.mockResolvedValue(null);
      mockQuery.where.mockReturnValue(findQuery);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should return array of email notifications for user', async () => {
      const mockEmails: EmailNotificationTable[] = [
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

      const findQuery = createThenable(mockEmails);
      mockQuery.where.mockReturnValue(findQuery);
      findQuery.orderBy.mockReturnValue(findQuery);

      const result = await repository.findByUserId('user-123');

      expect(mockQuery.where).toHaveBeenCalledWith('user_id', 'user-123');
      expect(findQuery.orderBy).toHaveBeenCalledWith('created_at', 'desc');
      expect(result).toEqual(mockEmails);
    });

    it('should filter by isRead when provided', async () => {
      const mockEmails: EmailNotificationTable[] = [
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
      ];

      const findQuery = createThenable(mockEmails);
      mockQuery.where.mockReturnValue(findQuery);
      findQuery.orderBy.mockReturnValue(findQuery);
      findQuery.where.mockReturnValue(findQuery);

      const result = await repository.findByUserId('user-123', { isRead: false });

      expect(findQuery.where).toHaveBeenCalledWith('is_read', false);
      expect(result).toEqual(mockEmails);
    });

    it('should apply limit when provided', async () => {
      const mockEmails: EmailNotificationTable[] = [
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
      ];

      const findQuery = createThenable(mockEmails);
      mockQuery.where.mockReturnValue(findQuery);
      findQuery.orderBy.mockReturnValue(findQuery);
      findQuery.limit.mockReturnValue(findQuery);

      const result = await repository.findByUserId('user-123', { limit: 10 });

      expect(findQuery.limit).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockEmails);
    });

    it('should apply both isRead filter and limit', async () => {
      const mockEmails: EmailNotificationTable[] = [];

      const findQuery = createThenable(mockEmails);
      mockQuery.where.mockReturnValue(findQuery);
      findQuery.orderBy.mockReturnValue(findQuery);
      findQuery.where.mockReturnValue(findQuery);
      findQuery.limit.mockReturnValue(findQuery);

      const result = await repository.findByUserId('user-123', { isRead: true, limit: 5 });

      expect(findQuery.where).toHaveBeenCalledWith('is_read', true);
      expect(findQuery.limit).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockEmails);
    });
  });

  describe('markAsRead', () => {
    it('should mark email as read and return true', async () => {
      const updateQuery = createThenable(1);
      mockQuery.where.mockReturnValue(updateQuery);
      updateQuery.update.mockReturnValue(updateQuery);

      const result = await repository.markAsRead('email-123');

      expect(mockQuery.where).toHaveBeenCalledWith('email_id', 'email-123');
      expect(updateQuery.update).toHaveBeenCalledWith({
        is_read: true,
      });
      expect(result).toBe(true);
    });

    it('should return false when email does not exist', async () => {
      const updateQuery = createThenable(0);
      mockQuery.where.mockReturnValue(updateQuery);
      updateQuery.update.mockReturnValue(updateQuery);

      const result = await repository.markAsRead('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('markAsReadByUserId', () => {
    it('should mark all unread emails as read for user and return count', async () => {
      const updateQuery = createThenable(3);
      mockQuery.where.mockReturnValue(updateQuery);
      updateQuery.where.mockReturnValue(updateQuery);
      updateQuery.update.mockReturnValue(updateQuery);

      const result = await repository.markAsReadByUserId('user-123');

      expect(mockQuery.where).toHaveBeenCalledWith('user_id', 'user-123');
      expect(updateQuery.where).toHaveBeenCalledWith('is_read', false);
      expect(updateQuery.update).toHaveBeenCalledWith({
        is_read: true,
      });
      expect(result).toBe(3);
    });

    it('should return 0 when no unread emails exist', async () => {
      const updateQuery = createThenable(0);
      mockQuery.where.mockReturnValue(updateQuery);
      updateQuery.where.mockReturnValue(updateQuery);
      updateQuery.update.mockReturnValue(updateQuery);

      const result = await repository.markAsReadByUserId('user-456');

      expect(result).toBe(0);
    });
  });
});

