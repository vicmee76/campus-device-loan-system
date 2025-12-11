import { Router } from 'express';
import reservationController from '../controller/reservation.controller';
import { authenticate, requireStudent, requireStaff } from '../utils/auth.middleware';

const router = Router();

router.post('/:deviceId/reserve', authenticate, requireStudent, reservationController.reserveDevice.bind(reservationController));
router.get('/get-all', authenticate, requireStaff, reservationController.getAllReservations.bind(reservationController));
router.get('/get-by-user-id/:userId', authenticate, requireStaff, reservationController.getReservationsByUserId.bind(reservationController));
router.get('/get-by-device-id/:deviceId', authenticate, requireStaff, reservationController.getReservationsByDeviceId.bind(reservationController));

export default router;

