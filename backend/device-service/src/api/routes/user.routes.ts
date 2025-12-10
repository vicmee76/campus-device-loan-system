import { Router } from 'express';
import userController from '../controller/user.controller';
import { validate, validatePartial } from '../utils/validation.middleware';
import { createUserRule, updateUserRule, emailRule, loginRule } from '../validations/user.validation';

const router = Router();

router.get('/get-all-users', userController.getAllUsers.bind(userController));

router.get('/get-user-by-id/:id', userController.getUserById.bind(userController));

router.delete('/soft-delete-user/:id', userController.softDeleteUser.bind(userController));

router.patch('/activate-user/:id', userController.activateUser.bind(userController));

router.patch('/deactivate-user/:id', userController.deactivateUser.bind(userController));

router.post('/login', validate(loginRule, 'body'), userController.login.bind(userController));

router.post('/create-user', validate(createUserRule, 'body'), userController.createUser.bind(userController));

router.get('/get-user-by-email', validate(emailRule, 'query'), userController.getUserByEmail.bind(userController));

router.put('/update-user/:id', validatePartial(updateUserRule, 'body'), userController.updateUser.bind(userController));

router.patch('/update-user/:id', validatePartial(updateUserRule, 'body'), userController.updateUser.bind(userController));

export default router;

