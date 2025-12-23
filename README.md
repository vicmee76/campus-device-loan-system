# 🎓 Campus Device Loan System

A cloud-native microservices platform for managing device loans in a campus environment. This system enables students and staff to reserve, borrow, and return devices (laptops, tablets, etc.) with automated workflows, waitlist management, and comprehensive tracking.


Student Name: Okeke Chiemelie Gerald
Student ID: C2581202

Description:
This repository contains the source code, infrastructure configuration,
documentation, and demonstration media for the Campus Device Loan System
developed as part of the Cloud Native DevOps (CIS3039-N) module.


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
├── frontend/              # Next.js web UI
├── .github/workflows/     # CI/CD workflows
└── docs/                  # Architecture diagrams and documentation
```

### Technology Stack

- **Backend**: Node.js, TypeScript, Express.js
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Database**: PostgreSQL
- **ORM/Query Builder**: Knex.js
- **Authentication**: JWT (JSON Web Tokens)
- **Testing**: Jest, Supertest, React Testing Library
- **Deployment**: DigitalOcean App Platform
- **Architecture Patterns**: Repository Pattern, Factory Pattern, Dependency Injection (TSyringe)

> 📖 **For detailed architecture documentation, API references, and component guides, see the [Documentation Hub](./docs/README.md)**

## 📁 Project Structure

### Backend Services

#### [Device Service](./docs/backend/device-service.md)
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

#### [Loan Service](./docs/backend/loan-service.md)
**Port**: 7779

Handles the loan lifecycle including checkouts, returns, overdue management, and loan history.

**Key Features**:
- Loan creation and management
- Return processing
- Overdue tracking
- Loan history
- Collections management

**Status**: Fully implemented with loan collection, returns, and tracking

### [Database](./docs/database/database.md)

Shared PostgreSQL database with centralized migrations and seeds.

**Features**:
- Global migration management
- Seed data for development
- Self-contained package with its own dependencies
- Shared across all backend services

### [Frontend](./frontend/README.md)

Next.js 14 web application providing a modern, responsive interface for students and staff.

**Features**:
- User authentication with JWT tokens
- Device catalog browsing and search
- Reservation and waitlist management
- Loan tracking
- Staff dashboard for loan operations
- Responsive design with Tailwind CSS

### Deployment

The application is deployed on **DigitalOcean App Platform** with automatic deployments triggered by pushes to the `main` branch.

**Infrastructure**:
- Backend services: Node.js apps on DigitalOcean App Platform
- Frontend: Next.js app on DigitalOcean App Platform
- Database: Managed PostgreSQL (external)
- CI/CD: GitHub Actions for tests and migrations

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
   
   # Create .env file (see [Device Service documentation](./docs/backend/device-service.md) for details)
   cp .env.example .env
   
   # Start the service
   npm run dev
   ```

4. **Set up Loan Service**
   ```bash
   cd backend/loan-service
   npm install
   
   # Create .env file (see [Loan Service documentation](./docs/backend/loan-service.md) for details)
   cp .env.example .env
   
   # Start the service
   npm run dev
   ```

5. **Set up Frontend** (Optional - for local development)
   ```bash
   cd frontend
   npm install
   
   # Create .env.local file
   echo "NEXT_PUBLIC_DEVICE_SERVICE_URL=http://localhost:7778" > .env.local
   echo "NEXT_PUBLIC_LOAN_SERVICE_URL=http://localhost:7779" >> .env.local
   
   # Start the development server
   npm run dev
   
   # Open http://localhost:3000 in your browser
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

See [Database documentation](./docs/database/database.md) for more details.

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
npm run test:coverage

# Loan Service
cd backend/loan-service
npm test
npm run test:unit
npm run test:integration
npm run test:coverage

# Frontend
cd frontend
npm test
npm run test:coverage
```

> 📋 **For a complete list of all test cases across the project, see [Test Cases Documentation](./TEST_CASES_DOCUMENTATION.md)**

## 📚 Documentation

For comprehensive documentation including architecture details, API references, and detailed component guides, see the **[Documentation Hub](./docs/README.md)**.

### Quick Links

- **[📖 Documentation Hub](./docs/README.md)** - Central documentation index with detailed guides
- **[🔌 API Reference](./docs/backend/API.md)** - Complete API documentation for all services
- **[📋 Test Cases Documentation](./TEST_CASES_DOCUMENTATION.md)** - Complete list of all test cases across the project
- [Device Service Documentation](./docs/backend/device-service.md) - Device service setup and usage
- [Loan Service Documentation](./docs/backend/loan-service.md) - Loan service setup and usage
- [Database Documentation](./docs/database/database.md) - Database migrations and seeds guide

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

> 📋 **For a comprehensive list of all test cases organized by service and component, see [Test Cases Documentation](./TEST_CASES_DOCUMENTATION.md)**

## 📝 API Endpoints

For complete API documentation including all endpoints, request/response formats, authentication requirements, and examples, see the **[API Reference](./docs/backend/API.md)**.

### Quick Overview

**Device Service (Port 7778)**:
- User authentication and management
- Device catalog and inventory
- Reservations and cancellations
- Waitlist management
- Health and monitoring endpoints

**Loan Service (Port 7779)**:
- Loan collection and returns
- Loan history and tracking
- Health and monitoring endpoints

All endpoints support pagination, comprehensive error handling, and role-based access control. See the [API Reference](./docs/backend/API.md) for detailed documentation.

## 🏛️ Architecture Patterns

- **Layered Architecture**: Controllers → Services → Repositories → Database
- **Dependency Injection**: Using TSyringe for loose coupling
- **Factory Pattern**: Transformations between DTOs and database models
- **Repository Pattern**: Abstract database access
- **Resilience Patterns**: Circuit Breaker, Retry, Timeout, Rate Limiting
- **Observability**: Correlation IDs, Metrics, Health Checks, Alerts

## 📊 Project Status

- ✅ Device Service - Fully implemented with comprehensive test coverage
- ✅ Loan Service - Fully implemented with loan management and tracking
- ✅ Frontend - Fully implemented with Next.js 14 and Tailwind CSS
- ✅ Database - Migrations and seeds with Knex.js
- ✅ Deployment - DigitalOcean App Platform with CI/CD
- ✅ Testing - Unit and integration tests for all services

## 👥 Student Information

**Full Name**: YOUR NAME  
**Student ID**: YOUR STUDENT ID

## 📄 License

ISC

## 🤝 Contributing

This is a student project. For questions or issues, please contact the project maintainer.

## 🚀 Deployment

The application is deployed on DigitalOcean App Platform:

**Automatic Deployments**:
- Push to `main` branch triggers automatic rebuild and deployment
- Build process handles TypeScript compilation and dependency management
- Health checks ensure services are running correctly

**Production Build Requirements**:
- Node.js 18.x
- Build dependencies (TypeScript, Tailwind) in `dependencies` (not `devDependencies`)
- Environment variables configured in DigitalOcean dashboard

**Services**:
- Device Service: Port 8080 (path: `/device`)
- Loan Service: Port 8080 (path: `/loan`)
- Frontend: Port 8080 (path: `/`)

For deployment details and troubleshooting, see the service-specific documentation.

---

**Last Updated**: December 2024
