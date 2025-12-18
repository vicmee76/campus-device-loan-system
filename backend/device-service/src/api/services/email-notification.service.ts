import { injectable } from 'tsyringe';
import emailNotificationRepository from '../repository/email-notification.repository';
import { EmailNotificationDto } from '../dtos/email-notification.dto';
import { ApiResponse, ResponseHelper } from '../dtos/response.dto';
import { logger } from '../utils/logger';
import EmailNotificationFactory from '../factory/email-notification.factory';

@injectable()
export class EmailNotificationService {
    async getEmailById(emailId: string): Promise<ApiResponse<EmailNotificationDto | null>> {
        logger.debug('getEmailById called', { emailId });
        try {
            if (!emailId) {
                logger.warn('getEmailById validation failed: emailId is required');
                return ResponseHelper.validationError('Email ID is required');
            }

            const email = await emailNotificationRepository.findById(emailId);
            if (!email) {
                logger.warn('getEmailById: email not found', { emailId });
                return ResponseHelper.notFound(`Email with ID ${emailId} not found`);
            }

            const emailDto = EmailNotificationFactory.toDto(email);

            logger.info('Email retrieved successfully', { emailId });
            return ResponseHelper.success(emailDto, 'Email retrieved successfully');
        } catch (error) {
            logger.error('getEmailById failed', error, { emailId });
            return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to retrieve email');
        }
    }

    async getEmailsByUserId(userId: string, options: { isRead?: boolean; limit?: number } = {}): Promise<ApiResponse<EmailNotificationDto[] | null>> {
        logger.debug('getEmailsByUserId called', { userId, options });
        try {
            if (!userId) {
                logger.warn('getEmailsByUserId validation failed: userId is required');
                return ResponseHelper.validationError('User ID is required');
            }

            const emails = await emailNotificationRepository.findByUserId(userId, options);
            const emailDtos = EmailNotificationFactory.toDtoArray(emails);

            logger.info('Emails retrieved successfully', { userId, count: emailDtos.length });
            return ResponseHelper.success(emailDtos, 'Emails retrieved successfully');
        } catch (error) {
            logger.error('getEmailsByUserId failed', error, { userId });
            return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to retrieve emails');
        }
    }

    async markAsRead(emailId: string): Promise<ApiResponse<null>> {
        logger.debug('markAsRead called', { emailId });
        try {              
            if (!emailId) {
                logger.warn('markAsRead validation failed: emailId is required');
                return ResponseHelper.validationError('Email ID is required');
            }

            const success = await emailNotificationRepository.markAsRead(emailId);
            if (!success) {
                logger.warn('markAsRead: email not found', { emailId });
                return ResponseHelper.notFound(`Email with ID ${emailId} not found`);
            }

            logger.info('Email marked as read successfully', { emailId });
            return ResponseHelper.success(null, 'Email marked as read successfully');
        } catch (error) {
            logger.error('markAsRead failed', error, { emailId });
            return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to mark email as read');
        }
    }
}

export default new EmailNotificationService();

