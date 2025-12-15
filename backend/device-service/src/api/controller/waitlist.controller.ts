import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import waitlistService from '../services/waitlist.service';
import { getStatusCode } from '../utils/controller.utils';
import { AuthenticatedRequest } from '../utils/auth.middleware';

@injectable()
export class WaitlistController {
  async joinWaitlist(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const { deviceId } = req.params;
    const userId = req.user!.userId;

    const result = await waitlistService.joinWaitlist(userId, deviceId);
    return res.status(getStatusCode(result)).json(result);
  }

  async removeFromWaitlist(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const { deviceId } = req.params;
    const userId = req.user!.userId;

    const result = await waitlistService.removeFromWaitlist(userId, deviceId);
    return res.status(getStatusCode(result)).json(result);
  }

  async getAllWaitlist(req: Request, res: Response): Promise<Response> {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10;

    const options = {
      page,
      pageSize,
    };

    const result = await waitlistService.getAllWaitlist(options);
    return res.status(getStatusCode(result)).json(result);
  }

  async getWaitlistByUserId(req: Request, res: Response): Promise<Response> {
    const { userId } = req.params;
    const result = await waitlistService.getWaitlistByUserId(userId);
    return res.status(getStatusCode(result)).json(result);
  }

  async getWaitlistByDeviceId(req: Request, res: Response): Promise<Response> {
    const { deviceId } = req.params;
    const result = await waitlistService.getWaitlistByDeviceId(deviceId);
    return res.status(getStatusCode(result)).json(result);
  }

  async getMyWaitlist(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const userId = req.user!.userId;
    const result = await waitlistService.getMyWaitlist(userId);
    return res.status(getStatusCode(result)).json(result);
  }
}

export default new WaitlistController();

