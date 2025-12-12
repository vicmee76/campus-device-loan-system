import { WaitlistRepository } from "../repository/waitlist.repository";
import { EmailService } from "./email.service";
import { logger } from "../utils/logger";

const waitlistRepo = new WaitlistRepository();
const emailService = new EmailService();

export class WaitlistNotifyService {
  async notifyNext(deviceId: string): Promise<void> {
    logger.debug('notifyNext called', { deviceId });
    
    try {
      const next = await waitlistRepo.nextUser(deviceId);
      
      if (!next) {
        logger.debug('notifyNext: no users on waitlist', { deviceId });
        return;
      }

      try {
        // Send email with circuit breaker and retry logic
        await emailService.sendWaitlistNotification(next.user_id, deviceId);
        
        // Mark as notified only if email was sent successfully
        await waitlistRepo.markNotified(next.waitlist_id);
        
        logger.info('User notified successfully', {
          userId: next.user_id,
          deviceId: next.device_id,
          waitlistId: next.waitlist_id,
        });
      } catch (emailError) {
        // Graceful degradation: Log error but don't mark as notified
        // This allows the system to retry notification later
        logger.error('Email notification failed, will retry later', emailError, {
          userId: next.user_id,
          deviceId: next.device_id,
          waitlistId: next.waitlist_id,
        });
        // Don't mark as notified, so it can be retried
      }
    } catch (error) {
      logger.error('notifyNext failed', error, { deviceId });
      // Don't throw - graceful degradation
    }
  }
}

export default new WaitlistNotifyService();

