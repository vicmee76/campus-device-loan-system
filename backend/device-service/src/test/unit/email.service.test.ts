import { EmailService } from '../../api/services/email.service';
import { CircuitBreaker, CircuitState } from '../../api/utils/circuit-breaker';
import { RetryHandler } from '../../api/utils/retry';
import { withTimeout } from '../../api/utils/timeout';
import emailNotificationRepository from '../../api/repository/email-notification.repository';

// Mock email notification repository
jest.mock('../../api/repository/email-notification.repository', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
  },
}));

// Mock circuit breaker
jest.mock('../../api/utils/circuit-breaker', () => {
  const mockExecute = jest.fn();
  return {
    CircuitBreaker: jest.fn().mockImplementation(() => ({
      execute: mockExecute,
      getState: jest.fn(() => CircuitState.CLOSED),
    })),
    CircuitState: {
      CLOSED: 'CLOSED',
      OPEN: 'OPEN',
      HALF_OPEN: 'HALF_OPEN',
    },
  };
});

// Mock retry handler
jest.mock('../../api/utils/retry', () => ({
  RetryHandler: {
    execute: jest.fn(),
  },
}));

// Mock timeout utility
jest.mock('../../api/utils/timeout', () => ({
  withTimeout: jest.fn(),
}));

describe('EmailService - Unit Tests', () => {
  let emailService: EmailService;
  let mockCircuitBreaker: jest.Mocked<CircuitBreaker>;
  const mockRetryHandler = RetryHandler as jest.Mocked<typeof RetryHandler>;
  const mockWithTimeout = withTimeout as jest.MockedFunction<typeof withTimeout>;
  const mockEmailNotificationRepository = emailNotificationRepository as jest.Mocked<typeof emailNotificationRepository>;

  beforeEach(() => {
    emailService = new EmailService();
    mockCircuitBreaker = (emailService as any).circuitBreaker;
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Clear environment variable before each test
    delete process.env.SIMULATE_EMAIL_FAILURE;
    
    // Setup default mock for repository
    mockEmailNotificationRepository.create.mockResolvedValue({
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
    } as any);
  });

  afterEach(() => {
    jest.useRealTimers();
    // Clean up environment variable
    delete process.env.SIMULATE_EMAIL_FAILURE;
  });

  describe('sendNotificationEmail', () => {
    const mockUserId = 'user-123';
    const mockUserEmail = 'user@example.com';
    const mockDeviceInfo = {
      brand: 'Apple',
      model: 'MacBook Pro',
    };

    it('should send email successfully', async () => {
      mockCircuitBreaker.execute.mockResolvedValue(undefined);

      await emailService.sendNotificationEmail(mockUserId, mockUserEmail, mockDeviceInfo);

      expect(mockCircuitBreaker.execute).toHaveBeenCalled();
    });

    it('should handle circuit breaker errors', async () => {
      mockCircuitBreaker.execute.mockRejectedValue(new Error('Circuit breaker is OPEN'));

      await expect(
        emailService.sendNotificationEmail(mockUserId, mockUserEmail, mockDeviceInfo)
      ).rejects.toThrow('Circuit breaker is OPEN');
    });

    it('should use retry handler with correct options', async () => {
      mockCircuitBreaker.execute.mockImplementation(async (fn) => {
        return await fn();
      });
      mockRetryHandler.execute.mockResolvedValue(undefined);

      await emailService.sendNotificationEmail(mockUserId, mockUserEmail, mockDeviceInfo);

      expect(mockRetryHandler.execute).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          maxAttempts: 3,
          initialDelay: 1000,
          maxDelay: 5000,
          backoffMultiplier: 2,
          retryableErrors: expect.any(Function),
        })
      );
    });

    it('should use timeout with correct parameters', async () => {
      mockCircuitBreaker.execute.mockImplementation(async (fn) => {
        return await fn();
      });
      mockRetryHandler.execute.mockImplementation(async (fn) => {
        return await fn();
      });
      mockWithTimeout.mockResolvedValue(undefined);

      await emailService.sendNotificationEmail(mockUserId, mockUserEmail, mockDeviceInfo);

      expect(mockWithTimeout).toHaveBeenCalledWith(
        expect.any(Promise),
        5000,
        'Email service timeout'
      );
      expect(mockEmailNotificationRepository.create).toHaveBeenCalled();
    });

    it('should retry on retryable errors', async () => {
      mockCircuitBreaker.execute.mockImplementation(async (fn) => {
        return await fn();
      });
      mockRetryHandler.execute.mockResolvedValue(undefined);

      await emailService.sendNotificationEmail(mockUserId, mockUserEmail, mockDeviceInfo);

      const retryOptions = mockRetryHandler.execute.mock.calls[0][1];
      const retryableErrors = retryOptions?.retryableErrors;
      expect(retryableErrors).toBeDefined();
      
      if (retryableErrors) {
        // Test retryable error cases
        const timeoutError: any = new Error('timeout');
        timeoutError.name = 'TimeoutError';
        expect(retryableErrors(timeoutError)).toBe(true);
        
        const networkError: any = new Error('network error');
        expect(retryableErrors(networkError)).toBe(true);
        
        const serverError: any = new Error('Server error');
        serverError.statusCode = 500;
        expect(retryableErrors(serverError)).toBe(true);
      }
    });

    it('should not retry on non-retryable errors', async () => {
      mockCircuitBreaker.execute.mockImplementation(async (fn) => {
        return await fn();
      });
      mockRetryHandler.execute.mockResolvedValue(undefined);

      await emailService.sendNotificationEmail(mockUserId, mockUserEmail, mockDeviceInfo);

      const retryOptions = mockRetryHandler.execute.mock.calls[0][1];
      const retryableErrors = retryOptions?.retryableErrors;
      expect(retryableErrors).toBeDefined();
      
      if (retryableErrors) {
        // Test non-retryable error cases
        const nonRetryableError = new Error('Invalid email');
        const result1 = retryableErrors(nonRetryableError);
        expect(result1 === false || result1 === undefined).toBe(true);
        
        const clientError: any = new Error('Bad request');
        clientError.statusCode = 400;
        const result2 = retryableErrors(clientError);
        expect(result2 === false || result2 === undefined).toBe(true);
      }
    });


    it('should get circuit breaker state', () => {
      const state = emailService.getCircuitBreakerState();
      expect(state).toBeDefined();
      expect(mockCircuitBreaker.getState).toHaveBeenCalled();
    });
  });
});

