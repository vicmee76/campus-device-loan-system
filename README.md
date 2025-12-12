# 🎓 Campus Device Loan System

A cloud-native microservices platform for managing device loans in a campus environment. This system enables students and staff to reserve, borrow, and return devices (laptops, tablets, etc.) with automated workflows, waitlist management, and comprehensive tracking.

## 📋 Overview

The Campus Device Loan System is a full-stack application built with a microservices architecture. It provides:

- **Device Catalog Management** - Browse and search available devices
- **Reservation System** - Reserve devices with automatic inventory assignment
- **Waitlist Management** - Queue system for unavailable devices
- **Loan Lifecycle Tracking** - Monitor checkouts, returns, and overdue items
- **User Management** - Authentication and authorization for students and staff
- **Real-time Notifications** - Email alerts for availability and reminders

## 🏗️ Architecture

This project follows a **microservices architecture** with the following components:

```
campus-device-loan-system/
├── backend/
│   ├── device-service/    # Device catalog, reservations, waitlist, users
│   └── loan-service/      # Loan lifecycle, returns, collections, notifications
├── database/              # Shared PostgreSQL database (migrations & seeds)
├── frontend/              # Web UI (to be implemented)
├── infra/                 # Infrastructure as Code (to be implemented)
└── docs/                  # Architecture diagrams and documentation
```

### Technology Stack

- **Backend**: Node.js, TypeScript, Express.js
- **Database**: PostgreSQL
- **ORM/Query Builder**: Knex.js
- **Authentication**: JWT (JSON Web Tokens)
- **Testing**: Jest, Supertest
- **Architecture Patterns**: Repository Pattern, Factory Pattern, Dependency Injection (TSyringe)

## 📁 Project Structure

### Backend Services

#### [Device Service](./backend/device-service/README.md)
**Port**: 7778

Manages the device catalog, inventory, reservations, waitlists, and user authentication.

**Key Features**:
- User authentication and JWT token generation
- Device catalog with search and filtering
- Device inventory tracking (physical units)
- Reservation management with concurrency handling
- Waitlist management (FIFO queue)
- Email notifications

**Entities**: Users, Devices, Device Inventory, Reservations, Waitlist

#### [Loan Service](./backend/loan-service/README.md)
**Port**: 7779

Handles the loan lifecycle including checkouts, returns, overdue management, and loan history.

**Key Features**:
- Loan creation and management
- Return processing
- Overdue tracking
- Loan history
- Collections management

**Status**: Foundation setup complete, business logic to be implemented

### [Database](./database/README.md)

Shared PostgreSQL database with centralized migrations and seeds.

**Features**:
- Global migration management
- Seed data for development
- Self-contained package with its own dependencies
- Shared across all backend services

### Frontend

Web UI for students and staff (to be implemented).

### Infrastructure

Infrastructure as Code for deployment (to be implemented).

### Documentation

Architecture diagrams, NFRs, plans, and project documentation.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd campus-device-loan-system
   ```

2. **Set up the database**
   ```bash
   # Create .env file at project root
   echo "DATABASE_URL=postgresql://user:password@localhost:5432/campus_device_loan" > .env
   
   # Install database dependencies
   cd database
   npm install
   
   # Run migrations
   npm run migrate:latest
   
   # (Optional) Run seeds
   npm run seed
   ```

3. **Set up Device Service**
   ```bash
   cd backend/device-service
   npm install
   
   # Create .env file (see device-service README for details)
   cp .env.example .env
   
   # Start the service
   npm run dev
   ```

4. **Set up Loan Service**
   ```bash
   cd backend/loan-service
   npm install
   
   # Create .env file (see loan-service README for details)
   cp .env.example .env
   
   # Start the service
   npm run dev
   ```

## 🔧 Development

### Running Migrations

From the project root:

```bash
# Using the helper script
./migrate.sh latest
./migrate.sh status
./migrate.sh rollback

# Or from database folder
cd database
npm run migrate:latest
```

See [Database README](./database/README.md) for more details.

### Environment Variables

Each service requires its own `.env` file. Key variables:

**Device Service & Loan Service**:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Shared secret for JWT token validation (must match in both services)
- `JWT_EXPIRES_IN` - Token expiration time (e.g., "24h")
- `PORT` - Service port (7778 for device-service, 7779 for loan-service)

**Project Root**:
- `DATABASE_URL` - Used for running migrations

### Testing

```bash
# Device Service
cd backend/device-service
npm test
npm run test:unit
npm run test:integration

# Loan Service
cd backend/loan-service
npm test
npm run test:unit
npm run test:integration
```

## 📚 Documentation

- [Device Service README](./backend/device-service/README.md) - Device service documentation
- [Loan Service README](./backend/loan-service/README.md) - Loan service documentation
- [Database README](./database/README.md) - Database migrations and seeds guide
- [Docs](./docs/) - Architecture diagrams and project documentation

## 🔐 Authentication

The system uses JWT-based authentication:

- **Device Service** generates JWT tokens during user login
- **Loan Service** validates tokens using a shared `JWT_SECRET`
- Both services must have the same `JWT_SECRET` environment variable
- Tokens contain: `userId`, `email`, and `role` (student/staff)

## 🗄️ Database

- **Shared Database**: All services connect to the same PostgreSQL database
- **Migrations**: Managed globally in `/database` folder
- **Models**: Each service has its own model interfaces and repositories
- **Seeds**: Development seed data in `/database/seeds`

## 🧪 Testing Strategy

- **Unit Tests**: Test individual services, repositories, and utilities
- **Integration Tests**: Test API endpoints end-to-end (with mocked database)
- **Test Coverage**: Aim for high coverage of business logic

## 📝 API Endpoints

### Device Service (Port 7778)

- `POST /v1/api/users/login` - User authentication
- `GET /v1/api/users/get-all-users` - List users (staff only)
- `GET /v1/api/users/get-user-by-id/:id` - Get user by ID (staff only)
- `GET /v1/api/devices/get-all-devices` - List all devices
- `GET /v1/api/devices/get-device-by-id/:id` - Get device by ID
- `GET /v1/api/devices/available-devices` - List available devices (students only)
- `POST /v1/api/reservations/:deviceId/reserve` - Reserve a device (students only)
- `PATCH /v1/api/reservations/:reservationId/cancel` - Cancel reservation
- `GET /v1/api/reservations` - List reservations
- `POST /v1/api/waitlist/:deviceId/join` - Join waitlist (students only)
- `DELETE /v1/api/waitlist/:deviceId/remove` - Remove from waitlist

### Loan Service (Port 7779)

Endpoints to be implemented.

## 🏛️ Architecture Patterns

- **Layered Architecture**: Controllers → Services → Repositories → Database
- **Dependency Injection**: Using TSyringe for loose coupling
- **Factory Pattern**: Transformations between DTOs and database models
- **Repository Pattern**: Abstract database access
- **Resilience Patterns**: Circuit Breaker, Retry, Timeout, Rate Limiting
- **Observability**: Correlation IDs, Metrics, Health Checks, Alerts

## 📊 Project Status

- ✅ Device Service - Fully implemented with tests
- 🚧 Loan Service - Foundation ready, business logic in progress
- ⏳ Frontend - To be implemented
- ⏳ Infrastructure - To be implemented

## 👥 Student Information

**Full Name**: YOUR NAME  
**Student ID**: YOUR STUDENT ID

## 📄 License

ISC

## 🤝 Contributing

This is a student project. For questions or issues, please contact the project maintainer.

---

**Last Updated**: December 2024
