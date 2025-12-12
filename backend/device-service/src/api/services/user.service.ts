import { injectable } from 'tsyringe';
import userRepository from '../repository/user.repository';
import { UserDto, LoginDto, LoginResponseDto, PaginatedResult } from '../dtos/user.dto';
import { ApiResponse, ResponseHelper } from '../dtos/response.dto';
import { comparePassword } from '../utils/password.utils';
import { generateToken } from '../utils/jwt.utils';
import UserFactory from '../factory/user.factory';
import { logger } from '../utils/logger';

@injectable()
export class UserService {
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

            if (!user.is_active) {
                logger.warn('login failed: user is inactive', { email: loginData.email, userId: user.user_id });
                return ResponseHelper.notFound('User is inactive');
            }

            if (user.is_deleted) {
                logger.warn('login failed: user is deleted', { email: loginData.email, userId: user.user_id });
                return ResponseHelper.notFound('User not found');
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

    async getCurrentUser(userId: string): Promise<ApiResponse<UserDto | null>> {
        logger.debug('getCurrentUser called', { userId });
        try {
            if (!userId) {
                logger.warn('getCurrentUser validation failed: userId is required');
                return ResponseHelper.validationError('User ID is required');
            }

            const user = await userRepository.findById(userId, false);
            if (!user) {
                logger.warn('getCurrentUser: user not found', { userId });
                return ResponseHelper.notFound('User not found');
            }

            // Don't return deleted or inactive users
            if (user.isDeleted || !user.isActive) {
                logger.warn('getCurrentUser: user is deleted or inactive', { userId, isDeleted: user.isDeleted, isActive: user.isActive });
                return ResponseHelper.notFound('User not found');
            }

            logger.info('Current user retrieved successfully', { userId });
            return ResponseHelper.success(user, 'Current user retrieved successfully');
        } catch (error) {
            logger.error('getCurrentUser failed', error, { userId });
            return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to retrieve current user');
        }
    }
}

export default new UserService();
