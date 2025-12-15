import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { deviceService } from '@/lib/api/device-service';
import Cookies from 'js-cookie';
import React from 'react';

jest.mock('@/lib/api/device-service');
jest.mock('js-cookie');

const mockDeviceService = deviceService as jest.Mocked<typeof deviceService>;
const mockCookies = Cookies as jest.Mocked<typeof Cookies>;

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCookies.get.mockReturnValue(undefined);
    mockCookies.remove.mockImplementation(() => {});
    mockCookies.set.mockImplementation(() => {});
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('should return initial state when no token exists', async () => {
      mockCookies.get.mockReturnValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isStaff).toBe(false);
      expect(result.current.isStudent).toBe(false);
    });

    it('should fetch user when token exists', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'student' as const,
        createdAt: '2024-01-01',
        isActive: true,
        isDeleted: false,
      };

      mockCookies.get.mockReturnValue('token-123');
      mockDeviceService.getCurrentUser.mockResolvedValue({
        success: true,
        code: '00',
        message: 'Success',
        data: mockUser,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe('token-123');
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isStudent).toBe(true);
    });

    it('should clear token when getCurrentUser fails', async () => {
      // Suppress expected console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockCookies.get.mockReturnValue('invalid-token');
      mockDeviceService.getCurrentUser.mockRejectedValue(new Error('Invalid token'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(mockCookies.remove).toHaveBeenCalledWith('token');

      consoleSpy.mockRestore();
    });

    it('should clear token when getCurrentUser returns unsuccessful response', async () => {
      mockCookies.get.mockReturnValue('token-123');
      mockDeviceService.getCurrentUser.mockResolvedValue({
        success: false,
        code: '05',
        message: 'User not found',
        data: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(mockCookies.remove).toHaveBeenCalledWith('token');
    });
  });

  describe('login', () => {
    it('should login successfully and set token', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'student' as const,
        createdAt: '2024-01-01',
        isActive: true,
        isDeleted: false,
      };

      mockDeviceService.login.mockResolvedValue({
        success: true,
        code: '00',
        message: 'Login successful',
        data: {
          token: 'new-token-123',
          user: mockUser,
        },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(mockCookies.set).toHaveBeenCalledWith('token', 'new-token-123', { expires: 7 });
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe('new-token-123');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should throw error when login fails', async () => {
      mockDeviceService.login.mockResolvedValue({
        success: false,
        code: '09',
        message: 'Invalid credentials',
        data: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        act(async () => {
          await result.current.login('test@example.com', 'wrong-password');
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should clear user and token on logout', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'student' as const,
        createdAt: '2024-01-01',
        isActive: true,
        isDeleted: false,
      };

      mockCookies.get.mockReturnValue('token-123');
      mockDeviceService.getCurrentUser.mockResolvedValue({
        success: true,
        code: '00',
        message: 'Success',
        data: mockUser,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      act(() => {
        result.current.logout();
      });

      expect(mockCookies.remove).toHaveBeenCalledWith('token');
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('role detection', () => {
    it('should detect staff role correctly', async () => {
      const mockStaffUser = {
        userId: 'user-456',
        email: 'staff@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'staff' as const,
        createdAt: '2024-01-01',
        isActive: true,
        isDeleted: false,
      };

      mockCookies.get.mockReturnValue('token-456');
      mockDeviceService.getCurrentUser.mockResolvedValue({
        success: true,
        code: '00',
        message: 'Success',
        data: mockStaffUser,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isStaff).toBe(true);
      expect(result.current.isStudent).toBe(false);
    });

    it('should detect student role correctly', async () => {
      const mockStudentUser = {
        userId: 'user-123',
        email: 'student@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'student' as const,
        createdAt: '2024-01-01',
        isActive: true,
        isDeleted: false,
      };

      mockCookies.get.mockReturnValue('token-123');
      mockDeviceService.getCurrentUser.mockResolvedValue({
        success: true,
        code: '00',
        message: 'Success',
        data: mockStudentUser,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isStaff).toBe(false);
      expect(result.current.isStudent).toBe(true);
    });
  });
});

