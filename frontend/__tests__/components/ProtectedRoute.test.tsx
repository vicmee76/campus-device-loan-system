import { render, screen } from '@testing-library/react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    } as any);
  });

  it('should render children when authenticated and no role requirement', () => {
    mockUseAuth.mockReturnValue({
      user: {
        userId: 'user-123',
        email: 'student@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'student',
      },
      isAuthenticated: true,
      isStaff: false,
      isStudent: true,
      isLoading: false,
      token: 'token-123',
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should redirect to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isStaff: false,
      isStudent: false,
      isLoading: false,
      token: null,
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should redirect to dashboard when staff required but user is student', () => {
    mockUseAuth.mockReturnValue({
      user: {
        userId: 'user-123',
        email: 'student@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'student',
      },
      isAuthenticated: true,
      isStaff: false,
      isStudent: true,
      isLoading: false,
      token: 'token-123',
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(
      <ProtectedRoute requireStaff>
        <div>Staff Only Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Staff Only Content')).not.toBeInTheDocument();
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('should redirect to staff when student required but user is staff', () => {
    mockUseAuth.mockReturnValue({
      user: {
        userId: 'user-456',
        email: 'staff@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'staff',
      },
      isAuthenticated: true,
      isStaff: true,
      isStudent: false,
      isLoading: false,
      token: 'token-456',
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(
      <ProtectedRoute requireStudent>
        <div>Student Only Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Student Only Content')).not.toBeInTheDocument();
    expect(mockPush).toHaveBeenCalledWith('/staff');
  });

  it('should render children when staff required and user is staff', () => {
    mockUseAuth.mockReturnValue({
      user: {
        userId: 'user-456',
        email: 'staff@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'staff',
      },
      isAuthenticated: true,
      isStaff: true,
      isStudent: false,
      isLoading: false,
      token: 'token-456',
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(
      <ProtectedRoute requireStaff>
        <div>Staff Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Staff Content')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should render children when student required and user is student', () => {
    mockUseAuth.mockReturnValue({
      user: {
        userId: 'user-123',
        email: 'student@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'student',
      },
      isAuthenticated: true,
      isStaff: false,
      isStudent: true,
      isLoading: false,
      token: 'token-123',
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(
      <ProtectedRoute requireStudent>
        <div>Student Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Student Content')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should show loading spinner when isLoading is true', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isStaff: false,
      isStudent: false,
      isLoading: true,
      token: null,
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    // Check for loading spinner by class name
    const loadingSpinner = document.querySelector('.animate-spin');
    expect(loadingSpinner).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});

