import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import userService from '../services/user.service';
import { getStatusCode } from '../utils/controller.utils';

@injectable()
export class UserController {
  async createUser(req: Request, res: Response): Promise<Response> {
    const result = await userService.createUser(req.body);
    return res.status(getStatusCode(result, 201)).json(result);
  }

  async getUserById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const includeDeleted = req.query.includeDeleted === 'true';
    const result = await userService.getUserById(id, includeDeleted);
    return res.status(getStatusCode(result)).json(result);
  }

  async getUserByEmail(req: Request, res: Response): Promise<Response> {
    const { email } = req.query;
    const includeDeleted = req.query.includeDeleted === 'true';
    const result = await userService.getUserByEmail(email as string, includeDeleted);
    return res.status(getStatusCode(result)).json(result);
  }

  async getAllUsers(req: Request, res: Response): Promise<Response> {
    const options = {
      role: req.query.role as 'student' | 'staff' | undefined,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      includeDeleted: req.query.includeDeleted === 'true',
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
    };

    const result = await userService.getAllUsers(options);
    return res.status(getStatusCode(result)).json(result);
  }

  async updateUser(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const result = await userService.updateUser(id, req.body);
    return res.status(getStatusCode(result)).json(result);
  }

  async softDeleteUser(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const result = await userService.softDeleteUser(id);
    return res.status(getStatusCode(result)).json(result);
  }

  async activateUser(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const result = await userService.activateUser(id);
    return res.status(getStatusCode(result)).json(result);
  }

  async deactivateUser(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const result = await userService.deactivateUser(id);
    return res.status(getStatusCode(result)).json(result);
  }
}

export default new UserController();

