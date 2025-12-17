# 📚 Campus Device Loan System - Documentation

Welcome to the comprehensive documentation for the Campus Device Loan System. This documentation is organized by project components and provides detailed information about each service, database, and infrastructure component.

## 📖 Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Documentation Index](#documentation-index)
- [Quick Links](#quick-links)

## 🎯 Overview

The Campus Device Loan System is a cloud-native microservices platform for managing device loans in a campus environment. This system enables students and staff to reserve, borrow, and return devices (laptops, tablets, etc.) with automated workflows, waitlist management, and comprehensive tracking.

### Key Features

- **Device Catalog Management** - Browse and search available devices
- **Reservation System** - Reserve devices with automatic inventory assignment
- **Waitlist Management** - Queue system for unavailable devices
- **Loan Lifecycle Tracking** - Monitor checkouts, returns, and overdue items
- **User Management** - Authentication and authorization for students and staff
- **Real-time Notifications** - Email alerts for availability and reminders

## 🏗️ Project Structure

```
campus-device-loan-system/
├── backend/
│   ├── device-service/    # Device catalog, reservations, waitlist, users
│   └── loan-service/      # Loan lifecycle, returns, collections, notifications
├── database/              # Shared PostgreSQL database (migrations & seeds)
├── frontend/              # Next.js web UI
├── .github/workflows/     # CI/CD workflows
└── docs/                  # Documentation (this folder)
```

## 📚 Documentation Index

### Backend Services

#### [Device Service](./backend/device-service.md)
**Port**: 7778 | **Location**: `backend/device-service/`

Manages the device catalog, inventory, reservations, waitlists, and user authentication.

**Key Features**:
- User authentication and JWT token generation
- Device catalog with search and filtering
- Device inventory tracking (physical units)
- Reservation management with concurrency handling
- Waitlist management (FIFO queue)
- Email notifications

**Entities**: Users, Devices, Device Inventory, Reservations, Waitlist

**Related Files**:
- Service README: [`backend/device-service/README.md`](../../backend/device-service/README.md)
- Test Documentation: [`backend/device-service/src/test/README.md`](../../backend/device-service/src/test/README.md)

#### [Loan Service](./backend/loan-service.md)
**Port**: 7779 | **Location**: `backend/loan-service/`

Handles the loan lifecycle including checkouts, returns, overdue management, and loan history.

**Key Features**:
- Loan creation and management
- Return processing
- Overdue tracking
- Loan history
- Collections management

**Entities**: Loans, Reservations, Device Inventory, Waitlist

**Related Files**:
- Service README: [`backend/loan-service/README.md`](../../backend/loan-service/README.md)

### Database

#### [Database Migrations & Seeds](./database/database.md)
**Location**: `database/`

Shared PostgreSQL database with centralized migrations and seeds.

**Features**:
- Global migration management
- Seed data for development
- Self-contained package with its own dependencies
- Shared across all backend services

**Related Files**:
- Database README: [`database/README.md`](../../database/README.md)

### Frontend

#### [Frontend](../../frontend/README.md)
**Location**: `frontend/`

Next.js 14 web application providing a modern, responsive interface for students and staff.

**Status**: ✅ Fully implemented

**Key Features**:
- User authentication with JWT tokens
- Device catalog browsing and search
- Reservation and waitlist management
- Loan tracking
- Staff dashboard for loan operations
- Responsive design with Tailwind CSS

**Technologies**:
- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Axios for API calls
- React Testing Library for tests

**Related Files**:
- Frontend README: [`frontend/README.md`](../../frontend/README.md)

### Deployment

**Platform**: DigitalOcean App Platform

The application is deployed on DigitalOcean App Platform with automatic deployments triggered by pushes to the `main` branch.

**Infrastructure**:
- Backend services: Node.js apps on DigitalOcean
- Frontend: Next.js app on DigitalOcean
- Database: Managed PostgreSQL (external)
- CI/CD: GitHub Actions for tests and migrations

**Key Configuration**:
- Build dependencies (TypeScript, Tailwind) are in `dependencies` (required for DigitalOcean builds)
- Auto-deployment on push to `main`
- Environment variables managed via DigitalOcean dashboard

### API Documentation

#### [API Reference](./API_REFERENCE.md)

Complete API documentation for both backend services including:
- Authentication & Authorization
- HTTP Status Codes
- Endpoint specifications
- Request/Response formats
- Required permissions

## 🔗 Quick Links

### Main Documentation
- [Main Project README](../README.md) - Project overview and getting started guide
- [API Reference](./API_REFERENCE.md) - Complete API documentation

### Service Documentation
- [Device Service](./backend/device-service.md) - Device service documentation
- [Loan Service](./backend/loan-service.md) - Loan service documentation
- [Database Guide](./database/database.md) - Database migrations and seeds

### Source READMEs
- [Device Service README](../../backend/device-service/README.md) - Original service README
- [Loan Service README](../../backend/loan-service/README.md) - Original service README
- [Database README](../../database/README.md) - Original database README

## 🚀 Getting Started

For setup instructions, see the [Main Project README](../README.md).

## 📝 Contributing

This is a student project. For questions or issues, please refer to the individual service documentation or contact the project maintainer.

---

**Last Updated**: December 2024

