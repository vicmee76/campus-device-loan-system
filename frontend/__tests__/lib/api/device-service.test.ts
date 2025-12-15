import axios from 'axios';
import Cookies from 'js-cookie';

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPatch = jest.fn();
const mockDelete = jest.fn();
const mockRequestInterceptor = jest.fn();

const mockAxiosInstance = {
  get: mockGet,
  post: mockPost,
  patch: mockPatch,
  delete: mockDelete,
  interceptors: {
    request: {
      use: mockRequestInterceptor,
    },
    response: {
      use: jest.fn(),
    },
  },
};

jest.mock('axios', () => ({
  create: jest.fn(() => mockAxiosInstance),
  default: {
    create: jest.fn(() => mockAxiosInstance),
  },
}));

const mockCookiesGet = jest.fn();
jest.mock('js-cookie', () => ({
  get: mockCookiesGet,
  set: jest.fn(),
  remove: jest.fn(),
}));

describe('DeviceServiceClient', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('login', () => {
    it('should call login endpoint with email and password', async () => {
      const { deviceService } = require('@/lib/api/device-service');
      mockPost.mockResolvedValue({ data: { success: true } });

      await deviceService.login('test@example.com', 'password123');

      expect(mockPost).toHaveBeenCalledWith('/users/login', {
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  describe('getCurrentUser', () => {
    it('should call get current user endpoint', async () => {
      const { deviceService } = require('@/lib/api/device-service');
      mockGet.mockResolvedValue({ data: { success: true } });

      await deviceService.getCurrentUser();

      expect(mockGet).toHaveBeenCalledWith('/users/me');
    });
  });

  describe('getAllUsers', () => {
    it('should call get all users endpoint with params', async () => {
      const { deviceService } = require('@/lib/api/device-service');
      mockGet.mockResolvedValue({ data: { success: true } });

      await deviceService.getAllUsers({ page: 1, pageSize: 10, role: 'student' });

      expect(mockGet).toHaveBeenCalledWith('/users/get-all-users', {
        params: { page: 1, pageSize: 10, role: 'student' },
      });
    });

    it('should call get all users endpoint without params', async () => {
      const { deviceService } = require('@/lib/api/device-service');
      mockGet.mockResolvedValue({ data: { success: true } });

      await deviceService.getAllUsers();

      expect(mockGet).toHaveBeenCalledWith('/users/get-all-users', { params: undefined });
    });
  });

  describe('getAllDevices', () => {
    it('should call get all devices endpoint with params', async () => {
      const { deviceService } = require('@/lib/api/device-service');
      mockGet.mockResolvedValue({ data: { success: true } });

      await deviceService.getAllDevices({ page: 1, pageSize: 10, search: 'laptop' });

      expect(mockGet).toHaveBeenCalledWith('/devices/get-all-devices', {
        params: { page: 1, pageSize: 10, search: 'laptop' },
      });
    });
  });

  describe('getAvailableDevices', () => {
    it('should call get available devices endpoint', async () => {
      const { deviceService } = require('@/lib/api/device-service');
      mockGet.mockResolvedValue({ data: { success: true } });

      await deviceService.getAvailableDevices();

      expect(mockGet).toHaveBeenCalledWith('/devices/available-devices', { params: undefined });
    });
  });

  describe('reserveDevice', () => {
    it('should call reserve device endpoint', async () => {
      const { deviceService } = require('@/lib/api/device-service');
      mockPost.mockResolvedValue({ data: { success: true } });

      await deviceService.reserveDevice('device-123');

      expect(mockPost).toHaveBeenCalledWith('/reservations/device-123/reserve');
    });
  });

  describe('cancelReservation', () => {
    it('should call cancel reservation endpoint', async () => {
      const { deviceService } = require('@/lib/api/device-service');
      mockPatch.mockResolvedValue({ data: { success: true } });

      await deviceService.cancelReservation('reservation-123');

      expect(mockPatch).toHaveBeenCalledWith('/reservations/reservation-123/cancel');
    });
  });

  describe('joinWaitlist', () => {
    it('should call join waitlist endpoint', async () => {
      const { deviceService } = require('@/lib/api/device-service');
      mockPost.mockResolvedValue({ data: { success: true } });

      await deviceService.joinWaitlist('device-123');

      expect(mockPost).toHaveBeenCalledWith('/waitlist/device-123/join');
    });
  });

  describe('getUserById', () => {
    it('should call get user by id endpoint', async () => {
      const { deviceService } = require('@/lib/api/device-service');
      mockGet.mockResolvedValue({ data: { success: true } });

      await deviceService.getUserById('user-123');

      expect(mockGet).toHaveBeenCalledWith('/users/get-user-by-id/user-123');
    });
  });

  describe('getDeviceById', () => {
    it('should call get device by id endpoint', async () => {
      const { deviceService } = require('@/lib/api/device-service');
      mockGet.mockResolvedValue({ data: { success: true } });

      await deviceService.getDeviceById('device-123');

      expect(mockGet).toHaveBeenCalledWith('/devices/get-device-by-id/device-123');
    });
  });

  describe('getInventoryByDeviceId', () => {
    it('should call get inventory by device id endpoint', async () => {
      const { deviceService } = require('@/lib/api/device-service');
      mockGet.mockResolvedValue({ data: { success: true } });

      await deviceService.getInventoryByDeviceId('device-123');

      expect(mockGet).toHaveBeenCalledWith('/device-inventory/get-by-device-id/device-123');
    });
  });

  describe('getAllInventory', () => {
    it('should call get all inventory endpoint with params', async () => {
      const { deviceService } = require('@/lib/api/device-service');
      mockGet.mockResolvedValue({ data: { success: true } });

      await deviceService.getAllInventory({ page: 1, pageSize: 10 });

      expect(mockGet).toHaveBeenCalledWith('/device-inventory/get-all', {
        params: { page: 1, pageSize: 10 },
      });
    });

    it('should call get all inventory endpoint without params', async () => {
      const { deviceService } = require('@/lib/api/device-service');
      mockGet.mockResolvedValue({ data: { success: true } });

      await deviceService.getAllInventory();

      expect(mockGet).toHaveBeenCalledWith('/device-inventory/get-all', { params: undefined });
    });
  });

  describe('getMyReservations', () => {
    it('should call get my reservations endpoint with params', async () => {
      const { deviceService } = require('@/lib/api/device-service');
      mockGet.mockResolvedValue({ data: { success: true } });

      await deviceService.getMyReservations({ page: 1, pageSize: 10 });

      expect(mockGet).toHaveBeenCalledWith('/reservations/me', {
        params: { page: 1, pageSize: 10 },
      });
    });

    it('should call get my reservations endpoint without params', async () => {
      const { deviceService } = require('@/lib/api/device-service');
      mockGet.mockResolvedValue({ data: { success: true } });

      await deviceService.getMyReservations();

      expect(mockGet).toHaveBeenCalledWith('/reservations/me', { params: undefined });
    });
  });

  describe('getAllReservations', () => {
    it('should call get all reservations endpoint with params', async () => {
      const { deviceService } = require('@/lib/api/device-service');
      mockGet.mockResolvedValue({ data: { success: true } });

      await deviceService.getAllReservations({ page: 1, pageSize: 10 });

      expect(mockGet).toHaveBeenCalledWith('/reservations/get-all', {
        params: { page: 1, pageSize: 10 },
      });
    });

    it('should call get all reservations endpoint without params', async () => {
      const { deviceService } = require('@/lib/api/device-service');
      mockGet.mockResolvedValue({ data: { success: true } });

      await deviceService.getAllReservations();

      expect(mockGet).toHaveBeenCalledWith('/reservations/get-all', { params: undefined });
    });
  });

  describe('getReservationsByUserId', () => {
    it('should call get reservations by user id endpoint', async () => {
      const { deviceService } = require('@/lib/api/device-service');
      mockGet.mockResolvedValue({ data: { success: true } });

      await deviceService.getReservationsByUserId('user-123');

      expect(mockGet).toHaveBeenCalledWith('/reservations/get-by-user-id/user-123');
    });
  });

  describe('removeFromWaitlist', () => {
    it('should call remove from waitlist endpoint', async () => {
      const { deviceService } = require('@/lib/api/device-service');
      mockDelete.mockResolvedValue({ data: { success: true } });

      await deviceService.removeFromWaitlist('device-123');

      expect(mockDelete).toHaveBeenCalledWith('/waitlist/device-123/remove');
    });
  });

  describe('getMyWaitlist', () => {
    it('should call get my waitlist endpoint', async () => {
      const { deviceService } = require('@/lib/api/device-service');
      mockGet.mockResolvedValue({ data: { success: true } });

      await deviceService.getMyWaitlist();

      expect(mockGet).toHaveBeenCalledWith('/waitlist/my-waitlist');
    });
  });

  describe('getAllWaitlist', () => {
    it('should call get all waitlist endpoint with params', async () => {
      const { deviceService } = require('@/lib/api/device-service');
      mockGet.mockResolvedValue({ data: { success: true } });

      await deviceService.getAllWaitlist({ page: 1, pageSize: 10 });

      expect(mockGet).toHaveBeenCalledWith('/waitlist/get-all', {
        params: { page: 1, pageSize: 10 },
      });
    });

    it('should call get all waitlist endpoint without params', async () => {
      const { deviceService } = require('@/lib/api/device-service');
      mockGet.mockResolvedValue({ data: { success: true } });

      await deviceService.getAllWaitlist();

      expect(mockGet).toHaveBeenCalledWith('/waitlist/get-all', { params: undefined });
    });
  });

  describe('getWaitlistByUserId', () => {
    it('should call get waitlist by user id endpoint', async () => {
      const { deviceService } = require('@/lib/api/device-service');
      mockGet.mockResolvedValue({ data: { success: true } });

      await deviceService.getWaitlistByUserId('user-123');

      expect(mockGet).toHaveBeenCalledWith('/waitlist/get-by-user-id/user-123');
    });
  });

  describe('request interceptor', () => {
    it('should add Authorization header when token exists', () => {
      let capturedInterceptor: ((config: any) => any) | undefined;

      // Clear previous calls
      mockRequestInterceptor.mockClear();
      mockCookiesGet.mockClear();
      
      // Capture the interceptor function when it's registered
      mockRequestInterceptor.mockImplementation((fn: (config: any) => any) => {
        capturedInterceptor = fn;
        return 0; // Return interceptor ID
      });

      // Set up token mock
      mockCookiesGet.mockReturnValue('test-token-123');

      // Reset modules to trigger interceptor setup
      jest.resetModules();
      require('@/lib/api/device-service');

      expect(capturedInterceptor).toBeDefined();
      expect(mockRequestInterceptor).toHaveBeenCalled();

      const mockConfig = {
        headers: {},
      };

      // Ensure token is returned when interceptor calls Cookies.get
      mockCookiesGet.mockReturnValue('test-token-123');

      // Call the interceptor function
      const result = capturedInterceptor!(mockConfig);

      // Verify Authorization header was added
      expect(result.headers.Authorization).toBe('Bearer test-token-123');
    });

    it('should not add Authorization header when token does not exist', () => {
      let capturedInterceptor: ((config: any) => any) | undefined;

      // Clear previous calls
      mockRequestInterceptor.mockClear();
      mockCookiesGet.mockClear();
      
      // Capture the interceptor function when it's registered
      mockRequestInterceptor.mockImplementation((fn: (config: any) => any) => {
        capturedInterceptor = fn;
        return 0; // Return interceptor ID
      });

      // Set up no token mock
      mockCookiesGet.mockReturnValue(undefined);

      // Reset modules to trigger interceptor setup
      jest.resetModules();
      require('@/lib/api/device-service');

      expect(capturedInterceptor).toBeDefined();
      expect(mockRequestInterceptor).toHaveBeenCalled();

      const mockConfig = {
        headers: {},
      };

      // Ensure no token is returned when interceptor calls Cookies.get
      mockCookiesGet.mockReturnValue(undefined);

      // Call the interceptor function
      const result = capturedInterceptor!(mockConfig);

      // Verify Authorization header was not added
      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('environment variable configuration', () => {
    it('should use NEXT_PUBLIC_DEVICE_SERVICE_URL when set', () => {
      process.env.NEXT_PUBLIC_DEVICE_SERVICE_URL = 'http://custom-url:8080';
      jest.resetModules();
      const axios = require('axios');
      const axiosCreateSpy = jest.spyOn(axios, 'create');

      require('@/lib/api/device-service');

      expect(axiosCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'http://custom-url:8080/v1/api',
        })
      );

      axiosCreateSpy.mockRestore();
    });

    it('should use default URL when NEXT_PUBLIC_DEVICE_SERVICE_URL is not set', () => {
      delete process.env.NEXT_PUBLIC_DEVICE_SERVICE_URL;
      jest.resetModules();
      const axios = require('axios');
      const axiosCreateSpy = jest.spyOn(axios, 'create');

      require('@/lib/api/device-service');

      expect(axiosCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'http://localhost:7778/v1/api',
        })
      );

      axiosCreateSpy.mockRestore();
    });
  });
});

