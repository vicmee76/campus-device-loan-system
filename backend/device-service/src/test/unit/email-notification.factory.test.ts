import EmailNotificationFactory from '../../api/factory/email-notification.factory';
import { EmailNotificationTable } from '../../api/model/email-notification.model';
import { EmailNotificationDto } from '../../api/dtos/email-notification.dto';

describe('EmailNotificationFactory - Unit Tests', () => {
  describe('toDto', () => {
    it('should convert EmailNotificationTable to EmailNotificationDto correctly', () => {
      const emailTable: EmailNotificationTable = {
        email_id: 'email-123',
        user_id: 'user-123',
        email_address: 'user@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
        status: 'sent',
        attempts: 1,
        error_message: null,
        sent_at: new Date('2024-01-01T00:00:00Z'),
        is_read: false,
        created_at: new Date('2024-01-01T00:00:00Z'),
      };

      const result = EmailNotificationFactory.toDto(emailTable);

      expect(result).toEqual({
        emailId: 'email-123',
        userId: 'user-123',
        emailAddress: 'user@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
        status: 'sent',
        attempts: 1,
        errorMessage: null,
        sentAt: new Date('2024-01-01T00:00:00Z'),
        isRead: false,
        createdAt: new Date('2024-01-01T00:00:00Z'),
      });
    });

    it('should handle failed status with error message', () => {
      const emailTable: EmailNotificationTable = {
        email_id: 'email-456',
        user_id: 'user-456',
        email_address: 'user2@example.com',
        subject: 'Failed Subject',
        body: 'Failed Body',
        status: 'failed',
        attempts: 3,
        error_message: 'Connection timeout',
        sent_at: null,
        is_read: true,
        created_at: new Date('2024-01-02T00:00:00Z'),
      };

      const result = EmailNotificationFactory.toDto(emailTable);

      expect(result.status).toBe('failed');
      expect(result.errorMessage).toBe('Connection timeout');
      expect(result.attempts).toBe(3);
      expect(result.isRead).toBe(true);
      expect(result.sentAt).toBeNull();
    });

    it('should handle pending status', () => {
      const emailTable: EmailNotificationTable = {
        email_id: 'email-789',
        user_id: 'user-789',
        email_address: 'user3@example.com',
        subject: 'Pending Subject',
        body: 'Pending Body',
        status: 'pending',
        attempts: 0,
        error_message: null,
        sent_at: null,
        is_read: false,
        created_at: new Date('2024-01-03T00:00:00Z'),
      };

      const result = EmailNotificationFactory.toDto(emailTable);

      expect(result.status).toBe('pending');
      expect(result.attempts).toBe(0);
      expect(result.sentAt).toBeNull();
    });
  });

  describe('toDtoArray', () => {
    it('should convert array of EmailNotificationTable to array of EmailNotificationDto', () => {
      const emailTables: EmailNotificationTable[] = [
        {
          email_id: 'email-1',
          user_id: 'user-1',
          email_address: 'user1@example.com',
          subject: 'Subject 1',
          body: 'Body 1',
          status: 'sent',
          attempts: 1,
          error_message: null,
          sent_at: new Date('2024-01-01T00:00:00Z'),
          is_read: false,
          created_at: new Date('2024-01-01T00:00:00Z'),
        },
        {
          email_id: 'email-2',
          user_id: 'user-2',
          email_address: 'user2@example.com',
          subject: 'Subject 2',
          body: 'Body 2',
          status: 'failed',
          attempts: 2,
          error_message: 'Error message',
          sent_at: null,
          is_read: true,
          created_at: new Date('2024-01-02T00:00:00Z'),
        },
      ];

      const result = EmailNotificationFactory.toDtoArray(emailTables);

      expect(result).toHaveLength(2);
      expect(result[0].emailId).toBe('email-1');
      expect(result[0].status).toBe('sent');
      expect(result[1].emailId).toBe('email-2');
      expect(result[1].status).toBe('failed');
      expect(result[1].errorMessage).toBe('Error message');
    });

    it('should return empty array for empty input', () => {
      const result = EmailNotificationFactory.toDtoArray([]);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });
});

