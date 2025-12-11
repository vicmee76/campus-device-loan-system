import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import deviceService from '../services/device.service';
import { getStatusCode } from '../utils/controller.utils';

@injectable()
export class DeviceController {
  async getDeviceById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const result = await deviceService.getDeviceById(id);
    return res.status(getStatusCode(result)).json(result);
  }

  async getAllDevices(req: Request, res: Response): Promise<Response> {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10;

    const options = {
      search: req.query.search as string | undefined,
      page,
      pageSize,
    };

    const result = await deviceService.getAllDevices(options);
    return res.status(getStatusCode(result)).json(result);
  }

  async availableDevices(req: Request, res: Response): Promise<Response> {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10;

    const options = {
      search: req.query.search as string | undefined,
      page,
      pageSize,
    };

    const result = await deviceService.availableDevices(options);
    return res.status(getStatusCode(result)).json(result);
  }
}

export default new DeviceController();

