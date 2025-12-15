# Device Service

Device Service for the Campus Device Loan System. This service manages device inventory and device-related operations.

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM/Query Builder**: Knex.js

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

   **Required Environment Variables:**
   - `DATABASE_URL` - PostgreSQL connection string (e.g., `postgresql://user:password@host:port/database`)
   - `JWT_SECRET` - Shared secret for JWT token generation (MUST match Loan Service)
   - `JWT_EXPIRES_IN` - Token expiration time (e.g., `24h`)
   - `PORT` - Service port (default: 7778)
   - `NODE_ENV` - Environment (development, production, test)
   - `CORS_ORIGIN` - Allowed CORS origin (default: `*`)
   - `LOG_LEVEL` - Logging level: DEBUG, INFO, WARN, ERROR (default: DEBUG)

   **Optional:**
   - `SIMULATE_EMAIL_FAILURE` - Set to `true` to simulate email failures for testing

4. **Important**: This service does NOT run migrations.
   - Migrations are located in the global `/database` folder at the project root
   - Migrations must be executed manually or via CI/CD BEFORE deploying
   - Run migrations from the project root:
   ```bash
   npx knex --knexfile database/knexfile.ts migrate:latest
   ```

5. Start the development server:
```bash
npm run dev
```

## Database Connection

This service connects to the shared PostgreSQL database using `DATABASE_URL` environment variable.

**Note**: Each service has its own `knexfile.ts` for database connections only. Migrations are managed globally in `/database`.

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run all tests
- `npm run test:unit` - Run unit tests only
- `npm run test:integration` - Run integration tests only
- `npm run test:coverage` - Run tests with coverage report

## Project Structure

```
backend/device-service/
├── src/
│   ├── api/
│   │   ├── controller/     # Request handlers
│   │   ├── dtos/           # Data Transfer Objects
│   │   ├── factory/        # Factory patterns
│   │   ├── model/          # Data models
│   │   ├── repository/     # Data access layer
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── database/
│   │   ├── connection.ts   # Database connection (uses local knexfile)
│   │   └── knexfile.ts     # Knex config (NO migrations)
│   └── index.ts            # Application entry point
├── package.json
└── tsconfig.json
```

## API Endpoints

See [API Reference](../API_REFERENCE.md) for complete endpoint documentation.

### Health & Monitoring

- `GET /health` - Liveness probe (service is running)
- `GET /ready` - Readiness probe (database is reachable)
- `GET /metrics` - Prometheus-style metrics

### User Management

- `POST /v1/api/users/login` - User authentication
- `GET /v1/api/users/me` - Get current user profile
- `GET /v1/api/users/get-all-users` - List all users (staff only)
- `GET /v1/api/users/get-user-by-id/:id` - Get user by ID (staff only)

### Device Management

- `GET /v1/api/devices/get-all-devices` - List all devices (public)
- `GET /v1/api/devices/get-device-by-id/:id` - Get device by ID (public)
- `GET /v1/api/devices/available-devices` - List available devices with inventory counts (authenticated, student role)

### Device Inventory

- `GET /v1/api/device-inventory/get-all` - List all inventory items (public)
- `GET /v1/api/device-inventory/get-by-id/:id` - Get inventory by ID (public)
- `GET /v1/api/device-inventory/get-by-device-id/:deviceId` - Get inventory for a device (public)

### Reservations

- `POST /v1/api/reservations/:deviceId/reserve` - Reserve a device (authenticated, student role)
- `PATCH /v1/api/reservations/:reservationId/cancel` - Cancel a reservation (authenticated, owner only)
- `GET /v1/api/reservations/get-all` - List all reservations (staff only)
- `GET /v1/api/reservations/get-by-user-id/:userId` - Get reservations by user ID (staff only)
- `GET /v1/api/reservations/get-by-device-id/:deviceId` - Get reservations by device ID (staff only)
- `GET /v1/api/reservations/me` - Get current user's reservations (authenticated)

### Waitlist

- `POST /v1/api/waitlist/:deviceId/join` - Join waitlist for a device (authenticated, student role)
- `DELETE /v1/api/waitlist/:deviceId/remove` - Remove from waitlist (authenticated, owner only)
- `GET /v1/api/waitlist/get-all` - List all waitlist entries (staff only)
- `GET /v1/api/waitlist/get-by-user-id/:userId` - Get waitlist by user ID (staff only)
- `GET /v1/api/waitlist/get-by-device-id/:deviceId` - Get waitlist by device ID (staff only)
- `GET /v1/api/waitlist/my-waitlist` - Get current user's waitlist (authenticated)

## Testing

See `src/test/README.md` for detailed testing documentation.

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run with coverage
npm run test:coverage
```

## Architecture

- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic layer
- **Repositories**: Database access layer
- **DTOs**: Data Transfer Objects
- **Factories**: Transform between DTOs and database models
- **Validations**: Request validation rules

## Related Documentation

- [API Reference](../API_REFERENCE.md) - Complete API documentation
- [Main Project README](../../README.md) - Project overview
- [Database Guide](../database/database.md) - Database migrations and seeds

