# Campus Device Loan System - Frontend

Next.js frontend application for the Campus Device Loan System.

## Features

- 🔐 User authentication with JWT tokens
- 📱 Responsive design with Tailwind CSS
- 📦 Device catalog browsing and search
- 📋 Reservation management
- ⏳ Waitlist management
- 💰 Loan tracking and management
- 👥 Staff dashboard for loan operations
- 🎨 Modern, intuitive UI/UX

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend services running (device-service on port 7778, loan-service on port 7779)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_DEVICE_SERVICE_URL=http://localhost:7778
NEXT_PUBLIC_LOAN_SERVICE_URL=http://localhost:7779
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── devices/           # Device catalog and details pages
│   ├── dashboard/         # User dashboard
│   ├── staff/             # Staff dashboard
│   ├── login/             # Login page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable React components
│   ├── Navbar.tsx
│   └── ProtectedRoute.tsx
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication context
├── lib/                   # Utilities and API clients
│   ├── api/              # API client services
│   │   ├── device-service.ts
│   │   └── loan-service.ts
│   └── types/            # TypeScript type definitions
└── public/               # Static assets
```

## Features Overview

### Authentication
- Login with email and password
- JWT token management via cookies
- Protected routes based on authentication status
- Role-based access control (student/staff)

### Device Catalog
- Browse all available devices
- Search devices by brand, model, or category
- View device details
- Reserve devices (if available)
- Join waitlist (if unavailable)

### User Dashboard
- View active reservations
- Manage waitlist entries
- Track loan history
- Cancel reservations

### Staff Dashboard
- View all loans and reservations
- Mark reservations as collected
- Mark loans as returned
- Monitor loan status

## API Integration

The frontend integrates with two backend services:

- **Device Service** (port 7778): Handles devices, reservations, waitlists, and user authentication
- **Loan Service** (port 7779): Handles loan lifecycle management

All API calls are made through client utilities in `lib/api/` that automatically handle:
- JWT token injection
- Error handling
- Response formatting

## Technologies

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework (in `dependencies` for production builds)
- **Axios** - HTTP client
- **js-cookie** - Cookie management
- **date-fns** - Date formatting
- **Jest** - Testing framework
- **React Testing Library** - Component testing

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Environment Variables

- `NEXT_PUBLIC_DEVICE_SERVICE_URL` - Device service base URL (default: http://localhost:7778)
- `NEXT_PUBLIC_LOAN_SERVICE_URL` - Loan service base URL (default: http://localhost:7779)

## Testing

The frontend has comprehensive test coverage:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

**Test Coverage**:
- Components (Navbar, ProtectedRoute)
- Contexts (AuthContext)
- API services (device-service, loan-service)
- Utility functions

## Production Build

The application is configured for DigitalOcean App Platform deployments:

**Build Configuration**:
- Build-time dependencies (Tailwind CSS, PostCSS, Autoprefixer) are in `dependencies`
- TypeScript path aliases configured with `baseUrl: "."`
- Tailwind config includes all component directories

**Build Commands**:
```bash
npm install  # Installs all dependencies
npm run build  # Builds the Next.js app
npm start  # Starts the production server
```

## Notes

- The frontend uses client-side rendering for most pages
- Authentication state is managed via React Context
- JWT tokens are stored in HTTP-only cookies (via js-cookie)
- Protected routes automatically redirect unauthenticated users to login
- Staff-only routes redirect non-staff users appropriately
- Path aliases (`@/*`) allow clean imports throughout the codebase


