import { CircuitBreaker, CircuitState } from '../utils/circuit-breaker';
import { RetryHandler } from '../utils/retry';
import { logger } from '../utils/logger';
import { withTimeout } from '../utils/timeout';
import emailNotificationRepository from '../repository/email-notification.repository';
import userRepository from '../repository/user.repository';
import deviceRepository from '../repository/device.repository';

export class EmailService {
  private circuitBreaker: CircuitBreaker;

  constructor() {
    // Circuit breaker for email service
    this.circuitBreaker = new CircuitBreaker('email-service', {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 60000,
    });
  }

  async sendWaitlistNotification(userId: string, deviceId: string): Promise<void> {
    // Use circuit breaker to protect against email service failures
    return this.circuitBreaker.execute(async () => {
      // Use retry with exponential backoff for transient failures
      return RetryHandler.execute(
        async () => {
          // Use timeout to prevent hanging requests
          return withTimeout(
            this.sendEmail(userId, deviceId),
            5000, // 5 second timeout
            'Email service timeout'
          );
        },
        {
          maxAttempts: 3,
          initialDelay: 1000,
          maxDelay: 5000,
          backoffMultiplier: 2,
          retryableErrors: (error) => {
            // Retry on network errors, timeouts, or 5xx errors
            return (
              error.name === 'TimeoutError' ||
              error.message?.includes('network') ||
              error.message?.includes('timeout') ||
              (error.statusCode && error.statusCode >= 500)
            );
          },
        }
      );
    });
  }

  private async sendEmail(userId: string, deviceId: string): Promise<void> {
    logger.info('Creating waitlist notification email record', {
      userId,
      deviceId,
      circuitState: this.circuitBreaker.getState(),
    });

    try {
      const user = await userRepository.findById(userId);
      const device = await deviceRepository.findById(deviceId);

      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      if (!device) {
        throw new Error(`Device not found: ${deviceId}`);
      }

      const subject = `Device Available: ${device.brand} ${device.model}`;
      const body = `
                  Hello ${user.first_name},

                  Great news! The device you requested is now available for reservation.

                  Device Details:
                  - Brand: ${device.brand}
                  - Model: ${device.model}
                  - Category: ${device.category}

                  Please log in to the Campus Device Loan System to reserve this device before it's claimed by someone else.

                  Best regards,
                  Campus Device Loan System
      `.trim();

    // Simulate potential failures for testing
    if (process.env.SIMULATE_EMAIL_FAILURE === 'true') {
      throw new Error('Email service temporarily unavailable');
    }

      // Create email notification using repository
      const emailRecord = await emailNotificationRepository.create(
        {
          userId,
          emailAddress: user.email,
          subject,
          body,
        },
        'sent'
      );

      logger.info('Email notification recorded successfully', { 
        emailId: emailRecord.emailId,
        userId, 
        deviceId 
      });
    } catch (error) {
      logger.error('Email notification failed', error, { userId, deviceId });
      throw error;
    }
  }

  getCircuitBreakerState(): CircuitState {
    return this.circuitBreaker.getState();
  }
}

export default new EmailService();

