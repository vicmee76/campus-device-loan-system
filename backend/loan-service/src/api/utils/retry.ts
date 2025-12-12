import { logger } from './logger';

export interface RetryOptions {
  maxAttempts: number;
  initialDelay: number; // in milliseconds
  maxDelay: number; // in milliseconds
  backoffMultiplier: number;
  retryableErrors?: (error: any) => boolean;
}

export class RetryHandler {
  static async execute<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
    }
  ): Promise<T> {
    let lastError: any;
    let delay = options.initialDelay;

    for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Check if error is retryable
        if (options.retryableErrors && !options.retryableErrors(error)) {
          logger.warn('Error is not retryable', { error: error instanceof Error ? error.message : error });
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === options.maxAttempts) {
          logger.error(`Retry exhausted after ${attempt} attempts`, error);
          throw error;
        }

        logger.warn(`Retry attempt ${attempt}/${options.maxAttempts} after ${delay}ms`, {
          error: error instanceof Error ? error.message : error,
        });

        // Wait before retrying
        await this.sleep(delay);

        // Calculate next delay with exponential backoff
        delay = Math.min(delay * options.backoffMultiplier, options.maxDelay);
      }
    }

    throw lastError;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Helper function for database connection errors
export const isRetryableDatabaseError = (error: any): boolean => {
  if (!error) return false;

  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code || '';

  // PostgreSQL connection errors
  const retryableCodes = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET'];
  const retryableMessages = ['connection', 'timeout', 'network', 'temporary'];

  return (
    retryableCodes.includes(errorCode) ||
    retryableMessages.some((msg) => errorMessage.includes(msg))
  );
};

