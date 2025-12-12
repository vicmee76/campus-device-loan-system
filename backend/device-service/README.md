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

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `.env` file with your database credentials.

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

- `GET /health` - Health check endpoint
