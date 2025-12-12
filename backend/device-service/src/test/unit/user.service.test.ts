import { UserService } from '../../api/services/user.service';
import userRepository from '../../api/repository/user.repository';
import { comparePassword } from '../../api/utils/password.utils';
import { generateToken } from '../../api/utils/jwt.utils';
import UserFactory from '../../api/factory/user.factory';
import { UserDto, LoginDto } from '../../api/dtos/user.dto';
import { UserTable } from '../../api/model/user.model';

// Mock dependencies
jest.mock('../../api/repository/user.repository');
jest.mock('../../api/utils/password.utils');
jest.mock('../../api/utils/jwt.utils');
jest.mock('../../api/factory/user.factory');

describe('UserService - Unit Tests', () => {
  let userService: UserService;
  const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>;
  const mockComparePassword = comparePassword as jest.MockedFunction<typeof comparePassword>;
  const mockGenerateToken = generateToken as jest.MockedFunction<typeof generateToken>;
  const mockUserFactory = UserFactory as jest.Mocked<typeof UserFactory>;

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    const mockUserId = 'user-123';
    const mockUserDto: UserDto = {
      userId: mockUserId,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'student',
      createdAt: new Date(),
      isActive: true,
      isDeleted: false,
    };

    it('should return user when found', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUserDto);

      const result = await userService.getUserById(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUserDto);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUserId, false);
    });

    it('should return not found when user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await userService.getUserById(mockUserId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('05');
      expect(result.data).toBeNull();
    });

    it('should return validation error when userId is empty', async () => {
      const result = await userService.getUserById('');

      expect(result.success).toBe(false);
      expect(result.code).toBe('09');
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockUserRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await userService.getUserById(mockUserId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('06');
    });
  });

  describe('getAllUsers', () => {
    const mockUsers: UserDto[] = [
      {
        userId: 'user-1',
        email: 'user1@example.com',
        firstName: 'User',
        lastName: 'One',
        role: 'student',
        createdAt: new Date(),
        isActive: true,
        isDeleted: false,
      },
    ];

    it('should return paginated users', async () => {
      const mockResult = {
        data: mockUsers,
        pagination: {
          page: 1,
          pageSize: 10,
          totalCount: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      mockUserRepository.findAll.mockResolvedValue(mockResult);

      const result = await userService.getAllUsers({ page: 1, pageSize: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(mockUserRepository.findAll).toHaveBeenCalledWith({ page: 1, pageSize: 10 });
    });

    it('should handle errors gracefully', async () => {
      mockUserRepository.findAll.mockRejectedValue(new Error('Database error'));

      const result = await userService.getAllUsers();

      expect(result.success).toBe(false);
      expect(result.code).toBe('06');
    });
  });

  describe('login', () => {
    const mockLoginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUserTable: UserTable = {
      user_id: 'user-123',
      email: 'test@example.com',
      password: 'hashed-password',
      first_name: 'Test',
      last_name: 'User',
      role: 'student',
      created_at: new Date(),
      is_active: true,
      is_deleted: false,
    };

    const mockUserDto: UserDto = {
      userId: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'student',
      createdAt: new Date(),
      isActive: true,
      isDeleted: false,
    };

    it('should login successfully with valid credentials', async () => {
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(mockUserTable);
      mockComparePassword.mockResolvedValue(true);
      mockUserFactory.toDto.mockReturnValue(mockUserDto);
      mockGenerateToken.mockReturnValue('mock-jwt-token');

      const result = await userService.login(mockLoginDto);

      expect(result.success).toBe(true);
      expect(result.data?.token).toBe('mock-jwt-token');
      expect(result.data?.user).toEqual(mockUserDto);
      expect(mockComparePassword).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(mockGenerateToken).toHaveBeenCalled();
    });

    it('should return error when email is missing', async () => {
      const result = await userService.login({ email: '', password: 'password' });

      expect(result.success).toBe(false);
      expect(result.code).toBe('09');
      expect(mockUserRepository.findByEmailWithPassword).not.toHaveBeenCalled();
    });

    it('should return error when password is missing', async () => {
      const result = await userService.login({ email: 'test@example.com', password: '' });

      expect(result.success).toBe(false);
      expect(result.code).toBe('09');
    });

    it('should return error when user not found', async () => {
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(null);

      const result = await userService.login(mockLoginDto);

      expect(result.success).toBe(false);
      expect(result.code).toBe('05');
      expect(mockComparePassword).not.toHaveBeenCalled();
    });

    it('should return error when password is invalid', async () => {
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(mockUserTable);
      mockComparePassword.mockResolvedValue(false);

      const result = await userService.login(mockLoginDto);

      expect(result.success).toBe(false);
      expect(result.code).toBe('05');
      expect(mockGenerateToken).not.toHaveBeenCalled();
    });

    it('should return error when user is inactive', async () => {
      const inactiveUser = { ...mockUserTable, is_active: false };
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(inactiveUser);
      mockComparePassword.mockResolvedValue(true);

      const result = await userService.login(mockLoginDto);

      expect(result.success).toBe(false);
      expect(result.code).toBe('05');
    });

    it('should return error when user is deleted', async () => {
      const deletedUser = { ...mockUserTable, is_deleted: true };
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(deletedUser);
      mockComparePassword.mockResolvedValue(true);

      const result = await userService.login(mockLoginDto);

      expect(result.success).toBe(false);
      expect(result.code).toBe('05');
    });

    it('should handle errors gracefully', async () => {
      mockUserRepository.findByEmailWithPassword.mockRejectedValue(new Error('Database error'));

      const result = await userService.login(mockLoginDto);

      expect(result.success).toBe(false);
      expect(result.code).toBe('06');
    });
  });

  describe('getCurrentUser', () => {
    const mockUserId = 'user-123';
    const mockUserDto: UserDto = {
      userId: mockUserId,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'student',
      createdAt: new Date(),
      isActive: true,
      isDeleted: false,
    };

    it('should return current user when found and active', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUserDto);

      const result = await userService.getCurrentUser(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUserDto);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUserId, false);
    });

    it('should return not found when user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await userService.getCurrentUser(mockUserId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('05');
      expect(result.data).toBeNull();
    });

    it('should return not found when user is deleted', async () => {
      const deletedUser = { ...mockUserDto, isDeleted: true };
      mockUserRepository.findById.mockResolvedValue(deletedUser);

      const result = await userService.getCurrentUser(mockUserId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('05');
      expect(result.message).toBe('User not found');
    });

    it('should return not found when user is inactive', async () => {
      const inactiveUser = { ...mockUserDto, isActive: false };
      mockUserRepository.findById.mockResolvedValue(inactiveUser);

      const result = await userService.getCurrentUser(mockUserId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('05');
      expect(result.message).toBe('User not found');
    });

    it('should return validation error when userId is empty', async () => {
      const result = await userService.getCurrentUser('');

      expect(result.success).toBe(false);
      expect(result.code).toBe('09');
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockUserRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await userService.getCurrentUser(mockUserId);

      expect(result.success).toBe(false);
      expect(result.code).toBe('06');
    });
  });
});

