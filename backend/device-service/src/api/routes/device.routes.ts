import { Router } from 'express';
import deviceController from '../controller/device.controller';
import { authenticate } from '../utils/auth.middleware';

const router = Router();

router.get('/get-all-devices', deviceController.getAllDevices.bind(deviceController));
router.get('/get-device-by-id/:id', deviceController.getDeviceById.bind(deviceController));
router.get('/available-devices', authenticate, deviceController.availableDevices.bind(deviceController));

export default router;
