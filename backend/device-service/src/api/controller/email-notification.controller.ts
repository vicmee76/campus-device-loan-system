import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import emailNotificationService from '../services/email-notification.service';
import { getStatusCode } from '../utils/controller.utils';

@injectable()
export class EmailNotificationController {
  async getEmailById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const result = await emailNotificationService.getEmailById(id);
    return res.status(getStatusCode(result)).json(result);
  }

  async getEmailsByUserId(req: Request, res: Response): Promise<Response> {
    const { userId } = req.params;
    const isRead = req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

    const options = {
      isRead,
      limit,
    };

    const result = await emailNotificationService.getEmailsByUserId(userId, options);
    return res.status(getStatusCode(result)).json(result);
  }

  async markAsRead(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const result = await emailNotificationService.markAsRead(id);
    return res.status(getStatusCode(result)).json(result);
  }
}

export default new EmailNotificationController();

