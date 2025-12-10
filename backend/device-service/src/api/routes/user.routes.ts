import { Router } from 'express';
import userController from '../controller/user.controller';
import { validate, validatePartial } from '../utils/validation.middleware';
import { createUserRule, updateUserRule, emailRule } from '../validations/user.validation';

const router = Router();

router.post('/', validate(createUserRule, 'body'), userController.createUser.bind(userController));

router.get('/email', validate(emailRule, 'query'), userController.getUserByEmail.bind(userController));

router.get('/:id', userController.getUserById.bind(userController));

router.get('/', userController.getAllUsers.bind(userController));

router.put('/:id', validatePartial(updateUserRule, 'body'), userController.updateUser.bind(userController));

router.patch('/:id', validatePartial(updateUserRule, 'body'), userController.updateUser.bind(userController));

router.delete('/:id', userController.softDeleteUser.bind(userController));

router.patch('/:id/activate', userController.activateUser.bind(userController));

router.patch('/:id/deactivate', userController.deactivateUser.bind(userController));

export default router;

