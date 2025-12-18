import { injectable } from 'tsyringe';
import db from '../../database/connection';
import { EmailNotificationTable } from '../model/email-notification.model';
import { CreateEmailNotificationDto } from '../dtos/email-notification.dto';

@injectable()
export class EmailNotificationRepository {
    private readonly tableName = 'email_notifications';

    async create(data: CreateEmailNotificationDto, status: 'sent' | 'failed' = 'sent', errorMessage?: string): Promise<EmailNotificationTable> {
        const [email] = await db(this.tableName)
            .insert({
                user_id: data.userId,
                email_address: data.emailAddress,
                subject: data.subject,
                body: data.body,
                status,
                attempts: 1,
                error_message: errorMessage || null,
                sent_at: status === 'sent' ? db.fn.now() : null,
                is_read: false,
                created_at: db.fn.now(),
            })
            .returning('*');

        return email as EmailNotificationTable;
    }

    async findById(emailId: string): Promise<EmailNotificationTable | null> {
        const email = await db(this.tableName)
            .where('email_id', emailId)
            .first();

        return email ? (email as EmailNotificationTable) : null;
    }

    async findByUserId(userId: string, options: { isRead?: boolean; limit?: number } = {}): Promise<EmailNotificationTable[]> {
        let query = db(this.tableName)
            .where('user_id', userId)
            .orderBy('created_at', 'desc');

        if (options.isRead !== undefined) {
            query = query.where('is_read', options.isRead);
        }

        if (options.limit) {
            query = query.limit(options.limit);
        }

        const emails = await query;
        return emails as EmailNotificationTable[];
    }

    async markAsRead(emailId: string): Promise<boolean> {
        const result = await db(this.tableName)
            .where('email_id', emailId)
            .update({
                is_read: true,
            });

        return result > 0;
    }

    async markAsReadByUserId(userId: string): Promise<number> {
        const result = await db(this.tableName)
            .where('user_id', userId)
            .where('is_read', false)
            .update({
                is_read: true,
            });

        return result;
    }
}

export default new EmailNotificationRepository();

