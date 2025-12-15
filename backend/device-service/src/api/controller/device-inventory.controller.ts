import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import deviceInventoryService from '../services/device-inventory.service';
import { getStatusCode } from '../utils/controller.utils';

@injectable()
export class DeviceInventoryController {
    async getDeviceInventoryByDeviceId(req: Request, res: Response): Promise<Response> {
        const { deviceId } = req.params;
        const result = await deviceInventoryService.getDeviceInventoryByDeviceId(deviceId);
        return res.status(getStatusCode(result)).json(result);
    }

    async getAllInventory(req: Request, res: Response): Promise<Response> {
        const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
        const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10;

        const options = {
            deviceId: req.query.deviceId as string | undefined,
            serialNumber: req.query.serialNumber as string | undefined,
            page,
            pageSize,
        };

        const result = await deviceInventoryService.getAllInventory(options);
        return res.status(getStatusCode(result)).json(result);
    }

    async getInventoryById(req: Request, res: Response): Promise<Response> {
        const { id } = req.params;
        const result = await deviceInventoryService.getInventoryById(id);
        return res.status(getStatusCode(result)).json(result);
    }
}

export default new DeviceInventoryController();

