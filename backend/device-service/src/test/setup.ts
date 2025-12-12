import 'reflect-metadata';

// Mock logger to avoid console output during tests
jest.mock('../api/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  runWithContext: jest.fn((context, callback) => callback()),
}));

// Mock metrics to avoid side effects during tests
jest.mock('../api/utils/metrics', () => ({
  metrics: {
    recordMetric: jest.fn(),
    recordJobMetrics: jest.fn(),
    getMetrics: jest.fn(() => []),
    getJobMetrics: jest.fn(() => []),
    getJobStats: jest.fn(() => null),
    clear: jest.fn(),
  },
  measureExecutionTime: jest.fn((name, fn) => fn()),
  measureExecutionTimeSync: jest.fn((name, fn) => fn()),
}));

// Mock password utilities
jest.mock('../api/utils/password.utils', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
  comparePassword: jest.fn().mockResolvedValue(true),
}));

// Mock JWT utilities
jest.mock('../api/utils/jwt.utils', () => ({
  generateToken: jest.fn().mockReturnValue('mock-jwt-token'),
  verifyToken: jest.fn().mockReturnValue({
    userId: 'user-123',
    email: 'test@example.com',
    role: 'student',
  }),
}));

// Mock database connection for all tests
jest.mock('../database/connection', () => {
  const createMockQuery = () => ({
    where: jest.fn().mockReturnThis(),
    whereIn: jest.fn().mockReturnThis(),
    whereILike: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    join: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    countDistinct: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    forUpdate: jest.fn().mockReturnThis(),
    skipLocked: jest.fn().mockReturnThis(),
    first: jest.fn(),
    clone: jest.fn().mockReturnThis(),
  });

  const mockKnexFn = jest.fn((tableName?: string) => createMockQuery());
  
  // Attach static methods to the mock function
  (mockKnexFn as any).raw = jest.fn().mockResolvedValue([{ rows: [] }]);
  (mockKnexFn as any).transaction = jest.fn().mockResolvedValue({
    ...createMockQuery(),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    fn: {
      now: jest.fn(),
    },
  });
  (mockKnexFn as any).fn = {
    now: jest.fn(),
  };

  return {
    __esModule: true,
    default: mockKnexFn,
  };
});

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '24h';
process.env.LOG_LEVEL = 'ERROR';

