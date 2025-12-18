import { EmailNotificationTable } from '../model/email-notification.model';
import { EmailNotificationDto } from '../dtos/email-notification.dto';

export class EmailNotificationFactory {
  static toDto(emailTable: EmailNotificationTable): EmailNotificationDto {
    return {
      emailId: emailTable.email_id,
      userId: emailTable.user_id,
      emailAddress: emailTable.email_address,
      subject: emailTable.subject,
      body: emailTable.body,
      status: emailTable.status,
      attempts: emailTable.attempts,
      errorMessage: emailTable.error_message,
      sentAt: emailTable.sent_at,
      isRead: emailTable.is_read,
      createdAt: emailTable.created_at,
    };
  }

  static toDtoArray(emailTables: EmailNotificationTable[]): EmailNotificationDto[] {
    return emailTables.map((emailTable) => this.toDto(emailTable));
  }
}

export default EmailNotificationFactory;

