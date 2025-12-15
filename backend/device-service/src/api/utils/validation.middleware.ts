import { Request, Response, NextFunction } from 'express';
import Validator from 'validatorjs';
import { ResponseHelper } from '../dtos/response.dto';
import { getValidationErrors } from './controller.utils';

Validator.register(
  'strong_password',
  (value: string | number | boolean) => {
    if (typeof value !== 'string') return false;
    if (value.length < 8) return false;
    if (!/[a-z]/.test(value)) return false;
    if (!/[A-Z]/.test(value)) return false;
    if (!/\d/.test(value)) return false;
    if (!/[@$!%*?&]/.test(value)) return false;
    return true;
  },
  'The :attribute must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).'
);

export const validate = (rules: { [key: string]: string }, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
    const validation = new Validator(data, rules);

    if (validation.fails()) {
      res.status(400).json(ResponseHelper.validationError(getValidationErrors(validation)));
      return;
    }

    next();
  };
};

export const validatePartial = (rules: { [key: string]: string }, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
    const partialRules: { [key: string]: string } = {};

    Object.keys(rules).forEach((key) => {
      if (data[key] !== undefined) {
        partialRules[key] = rules[key];
      }
    });

    if (Object.keys(partialRules).length === 0) {
      next();
      return;
    }

    const validation = new Validator(data, partialRules);

    if (validation.fails()) {
      res.status(400).json(ResponseHelper.validationError(getValidationErrors(validation)));
      return;
    }

    next();
  };
};

