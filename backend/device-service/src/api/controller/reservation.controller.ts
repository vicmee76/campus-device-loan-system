import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import reservationService from '../services/reservation.service';
import { getStatusCode } from '../utils/controller.utils';
import { AuthenticatedRequest } from '../utils/auth.middleware';

@injectable()
export class ReservationController {
  async reserveDevice(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const { deviceId } = req.params;
    const userId = req.user!.userId;

    const result = await reservationService.reserveDevice(userId, deviceId);
    
    if (!result.success && result.message && result.message.includes('No available devices for this model')) {
      return res.status(409).json(result);
    }

    return res.status(getStatusCode(result, 201)).json(result);
  }

  async getAllReservations(req: Request, res: Response): Promise<Response> {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10;

    const options = {
      page,
      pageSize,
    };

    const result = await reservationService.getAllReservations(options);
    return res.status(getStatusCode(result)).json(result);
  }

  async getReservationsByUserId(req: Request, res: Response): Promise<Response> {
    const { userId } = req.params;
    const result = await reservationService.getReservationsByUserId(userId);
    return res.status(getStatusCode(result)).json(result);
  }

  async getReservationsByDeviceId(req: Request, res: Response): Promise<Response> {
    const { deviceId } = req.params;
    const result = await reservationService.getReservationsByDeviceId(deviceId);
    return res.status(getStatusCode(result)).json(result);
  }

  async cancelReservation(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const { reservationId } = req.params;
    const userId = req.user!.userId;

    const result = await reservationService.cancelReservation(userId, reservationId);
    return res.status(getStatusCode(result)).json(result);
  }

  async getMyReservations(req: AuthenticatedRequest, res: Response): Promise<Response> {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        code: '06',
        message: 'User not authenticated',
        data: null,
      });
    }

    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10;

    const options = {
      page,
      pageSize,
    };

    const result = await reservationService.getMyReservations(req.user.userId, options);
    return res.status(getStatusCode(result)).json(result);
  }
}

export default new ReservationController();

