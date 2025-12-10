import { Router } from 'express';
import deviceController from '../controller/device.controller';

const router = Router();

router.get('/get-all-devices', deviceController.getAllDevices.bind(deviceController));

router.get('/get-device-by-id/:id', deviceController.getDeviceById.bind(deviceController));

export default router;

