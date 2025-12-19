import { injectable } from 'tsyringe';
import { CircuitBreaker, CircuitState } from '../utils/circuit-breaker';
import { RetryHandler } from '../utils/retry';
import { logger } from '../utils/logger';
import { withTimeout } from '../utils/timeout';
import emailNotificationRepository from '../repository/email-notification.repository';

@injectable()
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

  async sendNotificationEmail(userId: string, userEmail: string, deviceInfo: { brand: string; model: string }): Promise<void> {
    // Use circuit breaker to protect against email service failures
    return this.circuitBreaker.execute(async () => {
      // Use retry with exponential backoff for transient failures
      return RetryHandler.execute(
        async () => {
          // Use timeout to prevent hanging requests
          return withTimeout(
            this.sendEmail(userId, userEmail, deviceInfo),
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

  private async sendEmail(userId: string, userEmail: string, deviceInfo: { brand: string; model: string }): Promise<void> {
    const subject = `Device Available: ${deviceInfo.brand} ${deviceInfo.model}`;
    const body = `
                Hello,

                Great news! The device you requested is now available for reservation.

                Device Details:
                - Brand: ${deviceInfo.brand}
                - Model: ${deviceInfo.model}

                Please log in to the Campus Device Loan System to reserve this device before it's claimed by someone else.

                Best regards,
                Campus Device Loan System
    `.trim();

    logger.info('Creating email notification record', {
      userId,
      userEmail,
      subject,
      circuitState: this.circuitBreaker.getState(),
    });

    try {
    // Simulate potential failures for testing
    if (process.env.SIMULATE_EMAIL_FAILURE === 'true') {
      throw new Error('Email service temporarily unavailable');
    }

      // Create email notification using repository
      const emailRecord = await emailNotificationRepository.create(
        {
          userId,
          emailAddress: userEmail,
          subject,
          body,
        },
        'sent'
      );

      logger.info('Email notification recorded successfully', {
        emailId: emailRecord.email_id,
        userId,
        userEmail
      });
    } catch (error) {
      logger.error('Email notification failed', error, { userId, userEmail });
      throw error;
    }
  }

  getCircuitBreakerState(): CircuitState {
    return this.circuitBreaker.getState();
  }
}

export default new EmailService();

