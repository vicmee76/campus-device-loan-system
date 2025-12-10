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

4. Run database migrations:
```bash
npm run migrate
```

5. Start the development server:
```bash
npm run dev
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run migrate:rollback` - Rollback last migration
- `npm run migrate:make <name>` - Create a new migration
- `npm run seed` - Run database seeds

## Project Structure

```
backend/device-service/
├── src/
│   ├── config/         # Configuration files
│   ├── controller/     # Request handlers
│   ├── dtos/           # Data Transfer Objects
│   ├── factory/        # Factory patterns
│   ├── model/          # Data models
│   ├── migrations/     # Database migrations
│   ├── repository/     # Data access layer
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   └── index.ts        # Application entry point
├── knexfile.ts         # Knex configuration
├── package.json
└── tsconfig.json
```

## API Endpoints

- `GET /health` - Health check endpoint
