# Global Database Migrations and Seeds

This folder contains all database migrations and seeds for the entire monorepo.

## Structure

- `migrations/` - Database schema migrations (shared across all services)
- `seeds/` - Database seed data (shared across all services)
- `knexfile.ts` - Knex configuration for running migrations and seeds
- `package.json` - Dependencies for running migrations (self-contained)
- `node_modules/` - Local dependencies (install with `npm install`)

## Important Notes

- **This folder is self-contained with its own package.json and dependencies**
- **This knexfile is ONLY for running migrations and seeds**
- **Backend services do NOT import this knexfile**
- Each service has its own `knexfile.ts` for database connections only
- Migrations must be executed manually or via CI/CD BEFORE deploying services

## Setup

First, install dependencies in this folder:

```bash
cd database
npm install
```

## Running Migrations

From the project root (using the helper script):

```bash
./migrate.sh latest
./migrate.sh status
./migrate.sh rollback
```

Or directly from the database folder:

```bash
cd database
npm run migrate:latest
npm run migrate:status
npm run migrate:rollback
```

Or using npx from project root:

```bash
# Using DATABASE_URL environment variable
npx --prefix database knex --knexfile knexfile.ts migrate:latest

# Or with explicit environment
NODE_ENV=development npx --prefix database knex --knexfile knexfile.ts migrate:latest
```

## Running Seeds

From project root:
```bash
./migrate.sh seed
```

Or from database folder:
```bash
cd database
npm run seed
```

## Environment Variables

Create a `.env` file in the `database/` folder with your database connection:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/campus_device_loan
```

The knexfile will automatically load this `.env` file from the database folder.

## Migration Workflow

1. Create new migration: `npx knex --knexfile database/knexfile.ts migrate:make migration_name`
2. Edit the migration file in `database/migrations/`
3. Run migrations: `npx knex --knexfile database/knexfile.ts migrate:latest`
4. Rollback if needed: `npx knex --knexfile database/knexfile.ts migrate:rollback`

## Database Schema

The database contains the following tables:

- `users` - User accounts (students and staff)
- `devices` - Device models (laptops, tablets, etc.)
- `device_inventory` - Physical device units
- `reservations` - Device reservations
- `waitlist` - Waitlist entries for unavailable devices
- `loans` - Loan records (created when device is collected)

## Seed Data

Seed files provide development data:

- `01_devices.ts` - Sample device models
- `02_users.ts` - Sample user accounts (staff and students)
- `03_device_inventory.ts` - Sample inventory items

## Related Documentation

- [Main Project README](../../README.md) - Project overview
- [Device Service](../backend/device-service.md) - Device service documentation
- [Loan Service](../backend/loan-service.md) - Loan service documentation

