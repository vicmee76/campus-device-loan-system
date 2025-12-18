import { Router } from 'express';
import userController from '../controller/user.controller';
import emailNotificationController from '../controller/email-notification.controller';
import { validate } from '../utils/validation.middleware';
import { loginRule } from '../validations/user.validation';
import { authenticate, requireStaff } from '../utils/auth.middleware';

const router = Router();

router.post('/login', validate(loginRule, 'body'), userController.login.bind(userController));
router.get('/get-all-users', authenticate, requireStaff, userController.getAllUsers.bind(userController));
router.get('/get-user-by-id/:id', authenticate, requireStaff, userController.getUserById.bind(userController));
router.get('/me', authenticate, userController.getCurrentUser.bind(userController));

// Email notification routes
router.get('/emails/user/:userId', authenticate, emailNotificationController.getEmailsByUserId.bind(emailNotificationController));
router.get('/emails/:id', authenticate, emailNotificationController.getEmailById.bind(emailNotificationController));
router.patch('/emails/:id/mark-read', authenticate, emailNotificationController.markAsRead.bind(emailNotificationController));

export default router;
