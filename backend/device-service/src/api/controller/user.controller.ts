import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import userService from '../services/user.service';
import { getStatusCode } from '../utils/controller.utils';
import { AuthenticatedRequest } from '../utils/auth.middleware';

@injectable()
export class UserController {
  async login(req: Request, res: Response): Promise<Response> {
    const result = await userService.login(req.body);
    return res.status(getStatusCode(result)).json(result);
  }

  async getUserById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const includeDeleted = req.query.includeDeleted === 'true';
    const result = await userService.getUserById(id, includeDeleted);
    return res.status(getStatusCode(result)).json(result);
  }

    async getAllUsers(req: Request, res: Response): Promise<Response> {
        const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
        const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10;

        const options = {
            role: req.query.role as 'student' | 'staff' | undefined,
            isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
            includeDeleted: req.query.includeDeleted === 'true',
            firstName: req.query.firstName as string | undefined,
            lastName: req.query.lastName as string | undefined,
            email: req.query.email as string | undefined,
            page,
            pageSize,
        };

        const result = await userService.getAllUsers(options);
        return res.status(getStatusCode(result)).json(result);
    }

    async getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<Response> {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                code: '06',
                message: 'User not authenticated',
                data: null,
            });
        }

        const result = await userService.getCurrentUser(req.user.userId);
        return res.status(getStatusCode(result)).json(result);
    }
}

export default new UserController();

