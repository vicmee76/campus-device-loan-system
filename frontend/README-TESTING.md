# Frontend Testing Guide

This document describes the testing setup and structure for the frontend application.

## Setup

The frontend uses:
- **Jest** - Test runner
- **React Testing Library** - Component testing utilities
- **@testing-library/jest-dom** - Custom Jest matchers for DOM elements

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Structure

Tests are located in the `__tests__` directory mirroring the source structure:

```
__tests__/
  components/
    Navbar.test.tsx
    ProtectedRoute.test.tsx
  contexts/
    AuthContext.test.tsx
  lib/
    api/
      device-service.test.ts
      loan-service.test.ts
    utils.test.ts
```

## Test Coverage

### Components
- **Navbar** - Tests authentication state, user display, logout functionality
- **ProtectedRoute** - Tests route protection, role-based access, redirects

### Contexts
- **AuthContext** - Tests authentication flow, token management, user state

### Utilities
- **utils.ts** - Tests date formatting, error message extraction

### API Services
- **device-service.ts** - Tests API endpoint calls
- **loan-service.ts** - Tests API endpoint calls

## Writing New Tests

When adding new components or utilities:

1. Create a test file in the corresponding `__tests__` directory
2. Follow the existing test patterns
3. Use React Testing Library for component tests
4. Mock external dependencies (API calls, Next.js router, etc.)

## Mocking

### Next.js Router
The Next.js router is automatically mocked in `jest.setup.js`:
- `useRouter()` - Returns mock router with `push`, `replace`, etc.
- `usePathname()` - Returns current pathname
- `useSearchParams()` - Returns URL search params

### API Services
API services are mocked using Jest's module mocking:
```typescript
jest.mock('@/lib/api/device-service');
```

### Cookies
Cookies are mocked using:
```typescript
jest.mock('js-cookie');
```

## Best Practices

1. **Test behavior, not implementation** - Focus on what the component does, not how
2. **Use accessible queries** - Prefer `getByRole`, `getByLabelText`, etc.
3. **Mock external dependencies** - Don't make real API calls in tests
4. **Keep tests isolated** - Each test should be independent
5. **Use descriptive test names** - Test names should clearly describe what they test

