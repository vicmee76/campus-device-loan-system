import { CircuitBreaker, CircuitState } from '../utils/circuit-breaker';
import { RetryHandler } from '../utils/retry';
import { logger } from '../utils/logger';
import { withTimeout } from '../utils/timeout';

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
    // TODO: Replace with actual email service integration (e.g., SendGrid, AWS SES, etc.)
    // This is a mock implementation that simulates email sending

    logger.info('Sending waitlist notification email', {
      userId,
      deviceId,
      circuitState: this.circuitBreaker.getState(),
    });

    // Simulate email service call
    // In production, this would call your email provider API
    // Example:
    // await emailProvider.send({
    //   to: userEmail,
    //   subject: `Device Available: ${deviceInfo.brand} ${deviceInfo.model}`,
    //   body: `The device you requested is now available...`
    // });

    // Simulate potential failures for testing
    if (process.env.SIMULATE_EMAIL_FAILURE === 'true') {
      throw new Error('Email service temporarily unavailable');
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    logger.info('Email sent successfully', { userId, deviceId });
  }

  getCircuitBreakerState(): CircuitState {
    return this.circuitBreaker.getState();
  }
}

export default new EmailService();

