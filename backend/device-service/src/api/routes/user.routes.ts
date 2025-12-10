import { Router } from 'express';
import userController from '../controller/user.controller';
import { validate } from '../utils/validation.middleware';
import { loginRule } from '../validations/user.validation';

const router = Router();

router.post('/login', validate(loginRule, 'body'), userController.login.bind(userController));

router.get('/get-all-users', userController.getAllUsers.bind(userController));

router.get('/get-user-by-id/:id', userController.getUserById.bind(userController));

export default router;

