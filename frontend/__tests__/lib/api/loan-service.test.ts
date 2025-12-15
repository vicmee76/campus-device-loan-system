import axios from 'axios';
import Cookies from 'js-cookie';

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPatch = jest.fn();
const mockRequestInterceptor = jest.fn();

const mockAxiosInstance = {
  get: mockGet,
  post: mockPost,
  patch: mockPatch,
  delete: jest.fn(),
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

describe('LoanServiceClient', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('collectLoan', () => {
    it('should call collect loan endpoint', async () => {
      const { loanService } = require('@/lib/api/loan-service');
      mockPatch.mockResolvedValue({ data: { success: true } });

      await loanService.collectLoan('reservation-123');

      expect(mockPatch).toHaveBeenCalledWith('/loans/reservation-123/collect');
    });
  });

  describe('returnLoan', () => {
    it('should call return loan endpoint', async () => {
      const { loanService } = require('@/lib/api/loan-service');
      mockPatch.mockResolvedValue({ data: { success: true } });

      await loanService.returnLoan('loan-123');

      expect(mockPatch).toHaveBeenCalledWith('/loans/loan-123/return');
    });
  });

  describe('getAllLoans', () => {
    it('should call get all loans endpoint with params', async () => {
      const { loanService } = require('@/lib/api/loan-service');
      mockGet.mockResolvedValue({ data: { success: true } });

      await loanService.getAllLoans({ page: 1, pageSize: 10 });

      expect(mockGet).toHaveBeenCalledWith('/loans/get-all-loans', {
        params: { page: 1, pageSize: 10 },
      });
    });

    it('should call get all loans endpoint without params', async () => {
      const { loanService } = require('@/lib/api/loan-service');
      mockGet.mockResolvedValue({ data: { success: true } });

      await loanService.getAllLoans();

      expect(mockGet).toHaveBeenCalledWith('/loans/get-all-loans', { params: undefined });
    });
  });

  describe('getLoansByUserId', () => {
    it('should call get loans by user id endpoint with params', async () => {
      const { loanService } = require('@/lib/api/loan-service');
      mockGet.mockResolvedValue({ data: { success: true } });

      await loanService.getLoansByUserId('user-123', { page: 1, pageSize: 10 });

      expect(mockGet).toHaveBeenCalledWith('/loans/user/user-123', {
        params: { page: 1, pageSize: 10 },
      });
    });

    it('should call get loans by user id endpoint without params', async () => {
      const { loanService } = require('@/lib/api/loan-service');
      mockGet.mockResolvedValue({ data: { success: true } });

      await loanService.getLoansByUserId('user-123');

      expect(mockGet).toHaveBeenCalledWith('/loans/user/user-123', { params: undefined });
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
      require('@/lib/api/loan-service');

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
      require('@/lib/api/loan-service');

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
    it('should use NEXT_PUBLIC_LOAN_SERVICE_URL when set', () => {
      process.env.NEXT_PUBLIC_LOAN_SERVICE_URL = 'http://custom-url:9090';
      jest.resetModules();
      const axios = require('axios');
      const axiosCreateSpy = jest.spyOn(axios, 'create');

      require('@/lib/api/loan-service');

      expect(axiosCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'http://custom-url:9090/v1/api',
        })
      );

      axiosCreateSpy.mockRestore();
    });

    it('should use default URL when NEXT_PUBLIC_LOAN_SERVICE_URL is not set', () => {
      delete process.env.NEXT_PUBLIC_LOAN_SERVICE_URL;
      jest.resetModules();
      const axios = require('axios');
      const axiosCreateSpy = jest.spyOn(axios, 'create');

      require('@/lib/api/loan-service');

      expect(axiosCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'http://localhost:7779/v1/api',
        })
      );

      axiosCreateSpy.mockRestore();
    });
  });
});

