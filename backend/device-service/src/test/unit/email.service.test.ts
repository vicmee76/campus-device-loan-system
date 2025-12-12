import { EmailService } from '../../api/services/email.service';
import { CircuitBreaker, CircuitState } from '../../api/utils/circuit-breaker';

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

describe('EmailService - Unit Tests', () => {
  let emailService: EmailService;
  let mockCircuitBreaker: jest.Mocked<CircuitBreaker>;

  beforeEach(() => {
    emailService = new EmailService();
    mockCircuitBreaker = (emailService as any).circuitBreaker;
    jest.clearAllMocks();
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

    it('should get circuit breaker state', () => {
      const state = emailService.getCircuitBreakerState();
      expect(state).toBeDefined();
    });
  });
});

