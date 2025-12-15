import { Router } from 'express';
import waitlistController from '../controller/waitlist.controller';
import { authenticate, requireStaff } from '../utils/auth.middleware';

const router = Router();

router.post('/:deviceId/join', authenticate, waitlistController.joinWaitlist.bind(waitlistController));
router.delete('/:deviceId/remove', authenticate, waitlistController.removeFromWaitlist.bind(waitlistController));
router.get('/get-all', authenticate, requireStaff, waitlistController.getAllWaitlist.bind(waitlistController));
router.get('/get-by-user-id/:userId', authenticate, requireStaff, waitlistController.getWaitlistByUserId.bind(waitlistController));
router.get('/get-by-device-id/:deviceId', authenticate, requireStaff, waitlistController.getWaitlistByDeviceId.bind(waitlistController));
router.get('/my-waitlist', authenticate, waitlistController.getMyWaitlist.bind(waitlistController));

export default router;

