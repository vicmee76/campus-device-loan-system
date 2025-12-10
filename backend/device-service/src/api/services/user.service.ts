import { injectable } from 'tsyringe';
import userRepository from '../repository/user.repository';
import { CreateUserDto, UpdateUserDto, UserDto, LoginDto, LoginResponseDto, PaginatedResult } from '../dtos/user.dto';
import { ApiResponse, ResponseHelper } from '../dtos/response.dto';
import { comparePassword } from '../utils/password.utils';
import { generateToken } from '../utils/jwt.utils';
import UserFactory from '../factory/user.factory';
import { logger } from '../utils/logger';

@injectable()
export class UserService {

    async createUser(userData: CreateUserDto): Promise<ApiResponse<UserDto | null>> {
        logger.debug('createUser called', { email: userData.email, role: userData.role });
        try {
            if (!userData.email || !userData.firstName || !userData.lastName || !userData.role) {
                logger.warn('createUser validation failed: missing required fields', { userData });
                return ResponseHelper.validationError('email, firstName, lastName, and role are required');
            }

            const emailExists = await userRepository.emailExists(userData.email);
            if (emailExists) {
                logger.warn('createUser failed: email already exists', { email: userData.email });
                return ResponseHelper.validationError(`User with email ${userData.email} already exists`);
            }

            const user = await userRepository.create(userData);
            logger.info('User created successfully', { userId: user.userId, email: user.email });
            return ResponseHelper.success(user, 'User created successfully');
        } catch (error) {
            logger.error('createUser failed', error, { email: userData.email });
            return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to create user');
        }
    }



    async getUserById(userId: string, includeDeleted: boolean = false): Promise<ApiResponse<UserDto | null>> {
        logger.debug('getUserById called', { userId, includeDeleted });
        try {
            if (!userId) {
                logger.warn('getUserById validation failed: userId is required');
                return ResponseHelper.validationError('User ID is required');
            }

            const user = await userRepository.findById(userId, includeDeleted);
            if (!user) {
                logger.warn('getUserById: user not found', { userId, includeDeleted });
                return ResponseHelper.notFound(`User with ID ${userId} not found`);
            }

            logger.info('User retrieved successfully', { userId });
            return ResponseHelper.success(user, 'User retrieved successfully');
        } catch (error) {
            logger.error('getUserById failed', error, { userId });
            return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to retrieve user');
        }
    }



    async getUserByEmail(email: string, includeDeleted: boolean = false): Promise<ApiResponse<UserDto | null>> {
        logger.debug('getUserByEmail called', { email, includeDeleted });
        try {
            if (!email) {
                logger.warn('getUserByEmail validation failed: email is required');
                return ResponseHelper.validationError('Email is required');
            }

            const user = await userRepository.findByEmail(email, includeDeleted);
            if (!user) {
                logger.warn('getUserByEmail: user not found', { email, includeDeleted });
                return ResponseHelper.notFound(`User with email ${email} not found`);
            }

            logger.info('User retrieved successfully by email', { email, userId: user.userId });
            return ResponseHelper.success(user, 'User retrieved successfully');
        } catch (error) {
            logger.error('getUserByEmail failed', error, { email });
            return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to retrieve user');
        }
    }




    async getAllUsers(options: {
        role?: 'student' | 'staff';
        isActive?: boolean;
        includeDeleted?: boolean;
        firstName?: string;
        lastName?: string;
        email?: string;
        page?: number;
        pageSize?: number;
    } = {}): Promise<ApiResponse<PaginatedResult<UserDto> | null>> {
        logger.debug('getAllUsers called', { options });
        try {
            const result = await userRepository.findAll(options);
            logger.info('Users retrieved successfully', { 
                count: result.data.length, 
                totalCount: result.pagination.totalCount,
                page: result.pagination.page,
                options 
            });
            return ResponseHelper.success(result, 'Users retrieved successfully');
        } catch (error) {
            logger.error('getAllUsers failed', error, { options });
            return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to retrieve users');
        }
    }




    async updateUser(userId: string, userData: UpdateUserDto): Promise<ApiResponse<UserDto | null>> {
        logger.debug('updateUser called', { userId, updateFields: Object.keys(userData) });
        try {
            if (!userId) {
                logger.warn('updateUser validation failed: userId is required');
                return ResponseHelper.validationError('User ID is required');
            }

            const existingUser = await userRepository.findById(userId);
            if (!existingUser) {
                logger.warn('updateUser: user not found', { userId });
                return ResponseHelper.notFound(`User with ID ${userId} not found`);
            }

            if (userData.email && userData.email !== existingUser.email) {
                const emailExists = await userRepository.emailExists(userData.email, userId);
                if (emailExists) {
                    logger.warn('updateUser failed: email already exists', { userId, email: userData.email });
                    return ResponseHelper.validationError(`User with email ${userData.email} already exists`);
                }
            }

            const updatedUser = await userRepository.update(userId, userData);
            if (!updatedUser) {
                logger.error('updateUser failed: repository returned null', null, { userId });
                return ResponseHelper.error('Failed to update user');
            }

            logger.info('User updated successfully', { userId, updateFields: Object.keys(userData) });
            return ResponseHelper.success(updatedUser, 'User updated successfully');
        } catch (error) {
            logger.error('updateUser failed', error, { userId });
            return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to update user');
        }
    }




    async softDeleteUser(userId: string): Promise<ApiResponse<boolean | null>> {
        logger.debug('softDeleteUser called', { userId });
        try {
            if (!userId) {
                logger.warn('softDeleteUser validation failed: userId is required');
                return ResponseHelper.validationError('User ID is required');
            }

            const existingUser = await userRepository.findById(userId);
            if (!existingUser) {
                logger.warn('softDeleteUser: user not found', { userId });
                return ResponseHelper.notFound(`User with ID ${userId} not found`);
            }

            if (existingUser.isDeleted) {
                logger.warn('softDeleteUser failed: user already deleted', { userId });
                return ResponseHelper.validationError(`User with ID ${userId} is already deleted`);
            }

            const result = await userRepository.softDelete(userId);
            if (!result) {
                logger.error('softDeleteUser failed: repository returned false', null, { userId });
                return ResponseHelper.error('Failed to delete user');
            }

            logger.info('User soft deleted successfully', { userId });
            return ResponseHelper.success(true, 'User deleted successfully');
        } catch (error) {
            logger.error('softDeleteUser failed', error, { userId });
            return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to delete user');
        }
    }





    async activateUser(userId: string): Promise<ApiResponse<boolean | null>> {
        logger.debug('activateUser called', { userId });
        try {
            if (!userId) {
                logger.warn('activateUser validation failed: userId is required');
                return ResponseHelper.validationError('User ID is required');
            }

            const existingUser = await userRepository.findById(userId);
            if (!existingUser) {
                logger.warn('activateUser: user not found', { userId });
                return ResponseHelper.notFound(`User with ID ${userId} not found`);
            }

            if (existingUser.isActive) {
                logger.warn('activateUser failed: user already active', { userId });
                return ResponseHelper.validationError(`User with ID ${userId} is already active`);
            }

            const result = await userRepository.activate(userId);
            if (!result) {
                logger.error('activateUser failed: repository returned false', null, { userId });
                return ResponseHelper.error('Failed to activate user');
            }

            logger.info('User activated successfully', { userId });
            return ResponseHelper.success(true, 'User activated successfully');
        } catch (error) {
            logger.error('activateUser failed', error, { userId });
            return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to activate user');
        }
    }




    async deactivateUser(userId: string): Promise<ApiResponse<boolean | null>> {
        logger.debug('deactivateUser called', { userId });
        try {
            if (!userId) {
                logger.warn('deactivateUser validation failed: userId is required');
                return ResponseHelper.validationError('User ID is required');
            }

            const existingUser = await userRepository.findById(userId);
            if (!existingUser) {
                logger.warn('deactivateUser: user not found', { userId });
                return ResponseHelper.notFound(`User with ID ${userId} not found`);
            }

            if (!existingUser.isActive) {
                logger.warn('deactivateUser failed: user already inactive', { userId });
                return ResponseHelper.validationError(`User with ID ${userId} is already inactive`);
            }

            const result = await userRepository.deactivate(userId);
            if (!result) {
                logger.error('deactivateUser failed: repository returned false', null, { userId });
                return ResponseHelper.error('Failed to deactivate user');
            }

            logger.info('User deactivated successfully', { userId });
            return ResponseHelper.success(true, 'User deactivated successfully');
        } catch (error) {
            logger.error('deactivateUser failed', error, { userId });
            return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to deactivate user');
        }
    }

    async login(loginData: LoginDto): Promise<ApiResponse<LoginResponseDto | null>> {
        logger.debug('login called', { email: loginData.email });
        try {
            if (!loginData.email || !loginData.password) {
                logger.warn('login validation failed: email or password missing', { email: loginData.email });
                return ResponseHelper.validationError('email and password are required');
            }

            const user = await userRepository.findByEmailWithPassword(loginData.email);
            if (!user) {
                logger.warn('login failed: user not found or inactive', { email: loginData.email });
                return ResponseHelper.notFound('Invalid email or password');
            }

            const isPasswordValid = await comparePassword(loginData.password, user.password);
            if (!isPasswordValid) {
                logger.warn('login failed: invalid password', { email: loginData.email, userId: user.user_id });
                return ResponseHelper.notFound('Invalid email or password');
            }

            const userDto = UserFactory.toDto(user);
            const token = generateToken({ userId: userDto.userId, email: userDto.email, role: userDto.role });

            logger.info('User logged in successfully', { userId: userDto.userId, email: userDto.email, role: userDto.role });
            return ResponseHelper.success({ token: token, user: userDto }, 'Login successful');
        } catch (error) {
            logger.error('login failed', error, { email: loginData.email });
            return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to login');
        }
    }
}

export default new UserService();

