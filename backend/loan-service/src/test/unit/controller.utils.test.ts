/// <reference types="jest" />

import Validator from 'validatorjs';
import { getValidationErrors, getStatusCode } from '../../api/utils/controller.utils';
import { ApiResponse } from '../../api/dtos/response.dto';

describe('Controller Utils - Unit Tests', () => {
  describe('getValidationErrors', () => {
    it('should return empty string when there are no errors', () => {
      const mockValidator = {
        errors: {
          all: jest.fn().mockReturnValue({}),
          get: jest.fn(),
        },
      } as unknown as Validator.Validator<any>;

      const result = getValidationErrors(mockValidator);

      expect(result).toBe('');
    });

    it('should return comma-separated error messages', () => {
      const mockValidator = {
        errors: {
          all: jest.fn().mockReturnValue({
            field1: ['Error 1', 'Error 2'],
            field2: ['Error 3'],
          }),
          get: jest.fn((key: string) => {
            if (key === 'field1') return ['Error 1', 'Error 2'];
            if (key === 'field2') return ['Error 3'];
            return [];
          }),
        },
      } as unknown as Validator.Validator<any>;

      const result = getValidationErrors(mockValidator);

      expect(result).toBe('Error 1, Error 2, Error 3');
    });

    it('should handle single error', () => {
      const mockValidator = {
        errors: {
          all: jest.fn().mockReturnValue({
            field1: ['Single error'],
          }),
          get: jest.fn((key: string) => {
            if (key === 'field1') return ['Single error'];
            return [];
          }),
        },
      } as unknown as Validator.Validator<any>;

      const result = getValidationErrors(mockValidator);

      expect(result).toBe('Single error');
    });
  });

  describe('getStatusCode', () => {
    it('should return default success status code (200)', () => {
      const result: ApiResponse<any> = {
        success: true,
        code: '00',
        message: 'Success',
        data: { id: '123' },
      };

      const statusCode = getStatusCode(result);

      expect(statusCode).toBe(200);
    });

    it('should return custom default success status code', () => {
      const result: ApiResponse<any> = {
        success: true,
        code: '00',
        message: 'Created',
        data: { id: '123' },
      };

      const statusCode = getStatusCode(result, 201);

      expect(statusCode).toBe(201);
    });

    it('should return 404 for code 05 (not found)', () => {
      const result: ApiResponse<any> = {
        success: false,
        code: '05',
        message: 'Not found',
        data: null,
      };

      const statusCode = getStatusCode(result);

      expect(statusCode).toBe(404);
    });

    it('should return 400 for code 09 (validation error)', () => {
      const result: ApiResponse<any> = {
        success: false,
        code: '09',
        message: 'Validation error',
        data: null,
      };

      const statusCode = getStatusCode(result);

      expect(statusCode).toBe(400);
    });

    it('should return 500 for other error codes', () => {
      const result: ApiResponse<any> = {
        success: false,
        code: '06',
        message: 'Database error',
        data: null,
      };

      const statusCode = getStatusCode(result);

      expect(statusCode).toBe(500);
    });
  });
});

