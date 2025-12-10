import { injectable } from 'tsyringe';
import userRepository from '../repository/user.repository';
import { CreateUserDto, UpdateUserDto, UserDto } from '../dtos/user.dto';
import { ApiResponse, ResponseHelper } from '../dtos/response.dto';

@injectable()
export class UserService {

    async createUser(userData: CreateUserDto): Promise<ApiResponse<UserDto | null>> {
        try {
            if (!userData.Email || !userData.FirstName || !userData.LastName || !userData.Role)
                return ResponseHelper.validationError('Email, FirstName, LastName, and Role are required');

            const emailExists = await userRepository.emailExists(userData.Email);
            if (emailExists)
                return ResponseHelper.validationError(`User with email ${userData.Email} already exists`);

            const user = await userRepository.create(userData);
            return ResponseHelper.success(user, 'User created successfully');
        } catch (error) {
            return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to create user');
        }
    }



    async getUserById(userId: string, includeDeleted: boolean = false): Promise<ApiResponse<UserDto | null>> {
        try {
            if (!userId)
                return ResponseHelper.validationError('User ID is required');

            const user = await userRepository.findById(userId, includeDeleted);
            if (!user)
                return ResponseHelper.notFound(`User with ID ${userId} not found`);

            return ResponseHelper.success(user, 'User retrieved successfully');
        } catch (error) {
            return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to retrieve user');
        }
    }



    async getUserByEmail(email: string, includeDeleted: boolean = false): Promise<ApiResponse<UserDto | null>> {
        try {
            if (!email)
                return ResponseHelper.validationError('Email is required');

            const user = await userRepository.findByEmail(email, includeDeleted);
            if (!user)
                return ResponseHelper.notFound(`User with email ${email} not found`);

            return ResponseHelper.success(user, 'User retrieved successfully');
        } catch (error) {
            return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to retrieve user');
        }
    }




    async getAllUsers(options: {
        role?: 'student' | 'staff';
        isActive?: boolean;
        includeDeleted?: boolean;
        limit?: number;
        offset?: number;
    } = {}): Promise<ApiResponse<UserDto[] | null>> {
        try {
            const users = await userRepository.findAll(options);
            return ResponseHelper.success(users, 'Users retrieved successfully');
        } catch (error) {
            return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to retrieve users');
        }
    }




    async updateUser(userId: string, userData: UpdateUserDto): Promise<ApiResponse<UserDto | null>> {
        try {
            if (!userId)
                return ResponseHelper.validationError('User ID is required');

            const existingUser = await userRepository.findById(userId);
            if (!existingUser)
                return ResponseHelper.notFound(`User with ID ${userId} not found`);

            if (userData.Email && userData.Email !== existingUser.Email) {
                const emailExists = await userRepository.emailExists(userData.Email, userId);
                if (emailExists)
                    return ResponseHelper.validationError(`User with email ${userData.Email} already exists`);
            }

            const updatedUser = await userRepository.update(userId, userData);
            if (!updatedUser)
                return ResponseHelper.error('Failed to update user');

            return ResponseHelper.success(updatedUser, 'User updated successfully');
        } catch (error) {
            return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to update user');
        }
    }




    async softDeleteUser(userId: string): Promise<ApiResponse<boolean | null>> {
        try {
            if (!userId)
                return ResponseHelper.validationError('User ID is required');

            const existingUser = await userRepository.findById(userId);
            if (!existingUser)
                return ResponseHelper.notFound(`User with ID ${userId} not found`);

            if (existingUser.IsDeleted)
                return ResponseHelper.validationError(`User with ID ${userId} is already deleted`);

            const result = await userRepository.softDelete(userId);
            if (!result)
                return ResponseHelper.error('Failed to delete user');

            return ResponseHelper.success(true, 'User deleted successfully');
        } catch (error) {
            return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to delete user');
        }
    }





    async activateUser(userId: string): Promise<ApiResponse<boolean | null>> {
        try {
            if (!userId)
                return ResponseHelper.validationError('User ID is required');

            const existingUser = await userRepository.findById(userId);
            if (!existingUser)
                return ResponseHelper.notFound(`User with ID ${userId} not found`);

            if (existingUser.IsActive)
                return ResponseHelper.validationError(`User with ID ${userId} is already active`);

            const result = await userRepository.activate(userId);
            if (!result)
                return ResponseHelper.error('Failed to activate user');

            return ResponseHelper.success(true, 'User activated successfully');
        } catch (error) {
            return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to activate user');
        }
    }




    async deactivateUser(userId: string): Promise<ApiResponse<boolean | null>> {
        try {
            if (!userId)
                return ResponseHelper.validationError('User ID is required');

            const existingUser = await userRepository.findById(userId);
            if (!existingUser)
                return ResponseHelper.notFound(`User with ID ${userId} not found`);

            if (!existingUser.IsActive)
                return ResponseHelper.validationError(`User with ID ${userId} is already inactive`);

            const result = await userRepository.deactivate(userId);
            if (!result)
                return ResponseHelper.error('Failed to deactivate user');

            return ResponseHelper.success(true, 'User deactivated successfully');
        } catch (error) {
            return ResponseHelper.error(error instanceof Error ? error.message : 'Failed to deactivate user');
        }
    }
}

export default new UserService();

