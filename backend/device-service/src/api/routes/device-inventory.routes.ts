import { Router } from 'express';
import deviceInventoryController from '../controller/device-inventory.controller';

const router = Router();

router.get('/get-all', deviceInventoryController.getAllInventory.bind(deviceInventoryController));
router.get('/get-by-id/:id', deviceInventoryController.getInventoryById.bind(deviceInventoryController));
router.get('/get-by-device-id/:deviceId', deviceInventoryController.getDeviceInventoryByDeviceId.bind(deviceInventoryController));

export default router;
