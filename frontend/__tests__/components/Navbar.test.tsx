import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from '@/components/Navbar';
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

describe('Navbar', () => {
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

  it('should render login link when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
      isAuthenticated: false,
      isStaff: false,
      isStudent: false,
    });

    render(<Navbar />);

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('should render user info and logout button when authenticated as student', () => {
    const mockLogout = jest.fn();
    mockUseAuth.mockReturnValue({
      user: {
        userId: 'user-123',
        email: 'student@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'student',
        createdAt: '2024-01-01',
        isActive: true,
        isDeleted: false,
      },
      token: 'token-123',
      login: jest.fn(),
      logout: mockLogout,
      isLoading: false,
      isAuthenticated: true,
      isStaff: false,
      isStudent: true,
    });

    render(<Navbar />);

    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.getByText('Student Dashboard')).toBeInTheDocument();
    // Check for role in user info (more specific query)
    const userInfo = screen.getByText((content, element) => {
      return element?.textContent === 'John Doe (student)';
    });
    expect(userInfo).toBeInTheDocument();
  });

  it('should render user info and logout button when authenticated as staff', () => {
    const mockLogout = jest.fn();
    mockUseAuth.mockReturnValue({
      user: {
        userId: 'user-456',
        email: 'staff@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'staff',
        createdAt: '2024-01-01',
        isActive: true,
        isDeleted: false,
      },
      token: 'token-456',
      login: jest.fn(),
      logout: mockLogout,
      isLoading: false,
      isAuthenticated: true,
      isStaff: true,
      isStudent: false,
    });

    render(<Navbar />);

    expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.getByText('Staff Dashboard')).toBeInTheDocument();
    // Check for role in user info (more specific query)
    const userInfo = screen.getByText((content, element) => {
      return element?.textContent === 'Jane Smith (staff)';
    });
    expect(userInfo).toBeInTheDocument();
  });

  it('should call logout and navigate to login when logout button is clicked', () => {
    const mockLogout = jest.fn();
    mockUseAuth.mockReturnValue({
      user: {
        userId: 'user-123',
        email: 'student@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'student',
        createdAt: '2024-01-01',
        isActive: true,
        isDeleted: false,
      },
      token: 'token-123',
      login: jest.fn(),
      logout: mockLogout,
      isLoading: false,
      isAuthenticated: true,
      isStaff: false,
      isStudent: true,
    });

    render(<Navbar />);

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should show available devices link when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: {
        userId: 'user-123',
        email: 'student@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'student',
        createdAt: '2024-01-01',
        isActive: true,
        isDeleted: false,
      },
      token: 'token-123',
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
      isAuthenticated: true,
      isStaff: false,
      isStudent: true,
    });

    render(<Navbar />);

    expect(screen.getByText('Available Devices')).toBeInTheDocument();
  });

  it('should not show dashboard links when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
      isAuthenticated: false,
      isStaff: false,
      isStudent: false,
    });

    render(<Navbar />);

    expect(screen.queryByText('Student Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Staff Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Available Devices')).not.toBeInTheDocument();
  });
});

