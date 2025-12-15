# Test Suite Documentation

This directory contains automated unit and integration tests for the device service.

## Test Structure

```
src/test/
├── unit/                    # Unit tests (mocked dependencies)
│   ├── user.service.test.ts
│   ├── device.service.test.ts
│   ├── device-inventory.service.test.ts
│   ├── reservation.service.test.ts
│   ├── waitlist.service.test.ts
│   └── email.service.test.ts
├── integration/             # Integration tests (mocked database)
│   ├── user.integration.test.ts
│   ├── device.integration.test.ts
│   ├── reservation.integration.test.ts
│   └── waitlist.integration.test.ts
├── setup.ts                 # Test setup and mocks
└── README.md                # This file
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run only unit tests
```bash
npm run test:unit
```

### Run only integration tests
```bash
npm run test:integration
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

## Test Configuration

- **Test Framework**: Jest
- **Test Runner**: ts-jest (TypeScript support)
- **Mocking**: Jest mocks for unit tests
- **Database**: Real PostgreSQL for integration tests

## Unit Tests

Unit tests test individual services in isolation with all dependencies mocked.

### Services Tested:
- `UserService` - User operations and login
- `DeviceService` - Device retrieval operations
- `DeviceInventoryService` - Inventory operations
- `ReservationService` - Reservation creation and cancellation
- `WaitlistService` - Waitlist operations
- `EmailService` - Email notification service

### Mocking Strategy:
- Repositories are mocked to return controlled test data
- External services (email, JWT) are mocked
- Database connections are mocked
- Logger and metrics are mocked to avoid console output

## Integration Tests

Integration tests test the full API endpoints with mocked database connections. They verify the complete request/response flow through controllers, services, and repositories.

### Test Coverage:
- **User API** - Login flow, get all users, authentication/authorization
- **Device API** - Get all devices, get device by ID, available devices with inventory counts
- **Reservation API** - Create reservation, cancel reservation
- **Waitlist API** - Join waitlist, remove from waitlist

### Mocking Strategy:
- Database connections are mocked
- Repositories are mocked to return controlled test data
- JWT utilities are mocked for authentication
- Tests verify the complete API flow without requiring a real database

### Benefits:
- No database setup required
- Faster test execution
- Tests can run in any environment
- No test data cleanup needed

## Writing New Tests

### Unit Test Example:
```typescript
import { UserService } from '../../api/services/user.service';
import userRepository from '../../api/repository/user.repository';

jest.mock('../../api/repository/user.repository');

describe('UserService - Unit Tests', () => {
  let userService: UserService;
  const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>;

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  it('should return user when found', async () => {
    const mockUser = { userId: '123', email: 'test@example.com' };
    mockUserRepository.findById.mockResolvedValue(mockUser);

    const result = await userService.getUserById('123');

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockUser);
  });
});
```

### Integration Test Example:
```typescript
import request from 'supertest';
import app from '../../device-app';
import db from '../../database/connection';

describe('User API - Integration Tests', () => {
  beforeAll(async () => {
    await db.raw('SELECT 1');
  });

  afterAll(async () => {
    await db.destroy();
  });

  it('should login successfully', async () => {
    const response = await request(app)
      .post('/v1/api/users/login')
      .send({ email: 'test@example.com', password: 'password' })
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data after tests
3. **Mocking**: Mock external dependencies in unit tests
4. **Naming**: Use descriptive test names
5. **Assertions**: Test both success and error cases
6. **Coverage**: Aim for high code coverage

## Environment Variables for Testing

Create a `.env.test` file with test database configuration:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=test_user
DB_PASSWORD=test_password
DB_NAME=test_database
JWT_SECRET=test-secret-key
JWT_EXPIRES_IN=24h
```

## Troubleshooting

### Tests failing with database connection errors
- Ensure PostgreSQL is running
- Check database credentials in `.env` file
- Verify test database exists

### Mock not working
- Ensure `jest.mock()` is called before imports
- Check that the module path is correct
- Verify mock implementation matches the actual interface

### TypeScript errors in tests
- Ensure `@types/jest` is installed
- Check `tsconfig.test.json` includes Jest types
- Verify test files are in the correct directory

