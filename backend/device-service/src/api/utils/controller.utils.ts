import Validator from 'validatorjs';
import { ApiResponse } from '../dtos/response.dto';

export const getValidationErrors = (validation: Validator.Validator<any>): string => {
  const errors: string[] = [];
  Object.keys(validation.errors.all()).forEach((key) => {
    errors.push(...validation.errors.get(key));
  });
  return errors.join(', ');
};

export const getStatusCode = (result: ApiResponse<any>, defaultSuccess: number = 200): number => {
  if (result.success) return defaultSuccess;
  if (result.code === '05') return 404;
  if (result.code === '09') return 400;
  return 500;
};

