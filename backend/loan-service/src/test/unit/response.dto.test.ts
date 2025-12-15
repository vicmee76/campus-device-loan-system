/// <reference types="jest" />

import { ResponseHelper, ApiResponse } from '../../api/dtos/response.dto';

describe('Response DTO - Unit Tests', () => {
  describe('ResponseHelper.success', () => {
    it('should return success response with default message', () => {
      const result = ResponseHelper.success({ id: '123' });

      expect(result).toEqual({
        success: true,
        code: '00',
        message: 'Operation successful',
        data: { id: '123' },
      });
    });

    it('should return success response with custom message', () => {
      const result = ResponseHelper.success({ id: '123' }, 'Custom success message');

      expect(result).toEqual({
        success: true,
        code: '00',
        message: 'Custom success message',
        data: { id: '123' },
      });
    });

    it('should handle null data', () => {
      const result = ResponseHelper.success(null);

      expect(result).toEqual({
        success: true,
        code: '00',
        message: 'Operation successful',
        data: null,
      });
    });
  });

  describe('ResponseHelper.notFound', () => {
    it('should return not found response with default message', () => {
      const result = ResponseHelper.notFound();

      expect(result).toEqual({
        success: false,
        code: '05',
        message: 'Resource not found',
        data: null,
      });
    });

    it('should return not found response with custom message', () => {
      const result = ResponseHelper.notFound('User not found');

      expect(result).toEqual({
        success: false,
        code: '05',
        message: 'User not found',
        data: null,
      });
    });
  });

  describe('ResponseHelper.validationError', () => {
    it('should return validation error response with default message', () => {
      const result = ResponseHelper.validationError();

      expect(result).toEqual({
        success: false,
        code: '09',
        message: 'Validation error',
        data: null,
      });
    });

    it('should return validation error response with custom message', () => {
      const result = ResponseHelper.validationError('Invalid email format');

      expect(result).toEqual({
        success: false,
        code: '09',
        message: 'Invalid email format',
        data: null,
      });
    });
  });

  describe('ResponseHelper.error', () => {
    it('should return error response with default message', () => {
      const result = ResponseHelper.error();

      expect(result).toEqual({
        success: false,
        code: '06',
        message: 'An error occurred',
        data: null,
      });
    });

    it('should return error response with custom message', () => {
      const result = ResponseHelper.error('Database connection failed');

      expect(result).toEqual({
        success: false,
        code: '06',
        message: 'Database connection failed',
        data: null,
      });
    });
  });
});

