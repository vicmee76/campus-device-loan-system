/**
 * Response codes:
 * 00 - Success
 * 05 - Not found
 * 09 - Validation error
 * 06 - General error
 */
export type ResponseCode = '00' | '05' | '09' | '06';

export interface ApiResponse<T> {
  success: boolean;
  code: ResponseCode;
  message: string;
  data: T | null;
}

export class ResponseHelper {
  /**
   * Success response
   */
  static success<T>(data: T, message: string = 'Operation successful'): ApiResponse<T> {
    return {
      success: true,
      code: '00',
      message,
      data,
    };
  }

  /**
   * Not found response
   */
  static notFound<T = null>(message: string = 'Resource not found'): ApiResponse<T | null> {
    return {
      success: false,
      code: '05',
      message,
      data: null,
    };
  }

  /**
   * Validation error response
   */
  static validationError<T = null>(message: string = 'Validation error'): ApiResponse<T | null> {
    return {
      success: false,
      code: '09',
      message,
      data: null,
    };
  }

  /**
   * General error response
   */
  static error<T = null>(message: string = 'An error occurred'): ApiResponse<T | null> {
    return {
      success: false,
      code: '06',
      message,
      data: null,
    };
  }
}

