import request from 'supertest';
import app from '../../device-app';
import userRepository from '../../api/repository/user.repository';
import { UserTable } from '../../api/model/user.model';
import { UserDto } from '../../api/dtos/user.dto';
import UserFactory from '../../api/factory/user.factory';
import { comparePassword } from '../../api/utils/password.utils';
import { generateToken, verifyToken } from '../../api/utils/jwt.utils';

// Mock repositories
jest.mock('../../api/repository/user.repository');

describe('User API - Integration Tests', () => {
  const testUser = {
    email: 'testuser@example.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'student' as const,
  };

  const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>;
  const mockComparePassword = comparePassword as jest.MockedFunction<typeof comparePassword>;
  const mockGenerateToken = generateToken as jest.MockedFunction<typeof generateToken>;
  const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /v1/api/users/login', () => {
    const mockUserTable: UserTable = {
      user_id: 'user-123',
      email: testUser.email,
      password: 'hashed-password',
      first_name: testUser.firstName,
      last_name: testUser.lastName,
      role: testUser.role,
      created_at: new Date(),
      is_active: true,
      is_deleted: false,
    };

    it('should login successfully with valid credentials', async () => {
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(mockUserTable);
      mockComparePassword.mockResolvedValue(true);
      mockGenerateToken.mockReturnValue('mock-jwt-token');
      jest.spyOn(UserFactory, 'toDto').mockReturnValue({
        userId: mockUserTable.user_id,
        email: mockUserTable.email,
        firstName: mockUserTable.first_name,
        lastName: mockUserTable.last_name,
        role: mockUserTable.role,
        createdAt: mockUserTable.created_at,
        isActive: mockUserTable.is_active,
        isDeleted: mockUserTable.is_deleted,
      });

      const response = await request(app)
        .post('/v1/api/users/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    it('should return error with invalid email', async () => {
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(null);

      const response = await request(app)
        .post('/v1/api/users/login')
        .send({
          email: 'invalid@example.com',
          password: testUser.password,
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('05');
    });

    it('should return error with invalid password', async () => {
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(mockUserTable);
      mockComparePassword.mockResolvedValue(false);

      const response = await request(app)
        .post('/v1/api/users/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('05');
    });

    it('should return validation error when email is missing', async () => {
      const response = await request(app)
        .post('/v1/api/users/login')
        .send({
          password: testUser.password,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('09');
    });
  });

  describe('GET /v1/api/users/get-all-users', () => {
    const mockStaffUser: UserDto = {
      userId: 'staff-123',
      email: 'staff@example.com',
      firstName: 'Staff',
      lastName: 'User',
      role: 'staff',
      createdAt: new Date(),
      isActive: true,
      isDeleted: false,
    };

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

    it('should return users when authenticated as staff', async () => {
      const mockToken = 'valid-staff-token';
      mockVerifyToken.mockReturnValue({
        userId: mockStaffUser.userId,
        email: mockStaffUser.email,
        role: 'staff',
      });

      mockUserRepository.findAll.mockResolvedValue({
        data: mockUsers,
        pagination: {
          page: 1,
          pageSize: 10,
          totalCount: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      const response = await request(app)
        .get('/v1/api/users/get-all-users')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toBeDefined();
      expect(Array.isArray(response.body.data.data)).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .get('/v1/api/users/get-all-users')
        .expect(401);
    });

    it('should support pagination', async () => {
      const mockToken = 'valid-staff-token';
      mockVerifyToken.mockReturnValue({
        userId: mockStaffUser.userId,
        email: mockStaffUser.email,
        role: 'staff',
      });

      mockUserRepository.findAll.mockResolvedValue({
        data: mockUsers,
        pagination: {
          page: 1,
          pageSize: 5,
          totalCount: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      const response = await request(app)
        .get('/v1/api/users/get-all-users?page=1&pageSize=5')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.pageSize).toBe(5);
    });
  });

  describe('GET /v1/api/users/me', () => {
    const mockStudentUser: UserDto = {
      userId: 'student-123',
      email: 'student@example.com',
      firstName: 'Student',
      lastName: 'User',
      role: 'student',
      createdAt: new Date(),
      isActive: true,
      isDeleted: false,
    };

    const mockStaffUser: UserDto = {
      userId: 'staff-123',
      email: 'staff@example.com',
      firstName: 'Staff',
      lastName: 'User',
      role: 'staff',
      createdAt: new Date(),
      isActive: true,
      isDeleted: false,
    };

    it('should return current user profile for student', async () => {
      const mockToken = 'valid-student-token';
      mockVerifyToken.mockReturnValue({
        userId: mockStudentUser.userId,
        email: mockStudentUser.email,
        role: 'student',
      });

      mockUserRepository.findById.mockResolvedValue(mockStudentUser);

      const response = await request(app)
        .get('/v1/api/users/me')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.userId).toBe(mockStudentUser.userId);
      expect(response.body.data.email).toBe(mockStudentUser.email);
      expect(response.body.data.role).toBe('student');
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockStudentUser.userId, false);
    });

    it('should return current user profile for staff', async () => {
      const mockToken = 'valid-staff-token';
      mockVerifyToken.mockReturnValue({
        userId: mockStaffUser.userId,
        email: mockStaffUser.email,
        role: 'staff',
      });

      mockUserRepository.findById.mockResolvedValue(mockStaffUser);

      const response = await request(app)
        .get('/v1/api/users/me')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.userId).toBe(mockStaffUser.userId);
      expect(response.body.data.email).toBe(mockStaffUser.email);
      expect(response.body.data.role).toBe('staff');
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockStaffUser.userId, false);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .get('/v1/api/users/me')
        .expect(401);
    });

    it('should return 404 when user not found', async () => {
      const mockToken = 'valid-token';
      mockVerifyToken.mockReturnValue({
        userId: 'non-existent-user',
        email: 'nonexistent@example.com',
        role: 'student',
      });

      mockUserRepository.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/v1/api/users/me')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('05');
    });

    it('should return 404 when user is deleted', async () => {
      const mockToken = 'valid-token';
      const deletedUser = { ...mockStudentUser, isDeleted: true };
      mockVerifyToken.mockReturnValue({
        userId: mockStudentUser.userId,
        email: mockStudentUser.email,
        role: 'student',
      });

      mockUserRepository.findById.mockResolvedValue(deletedUser);

      const response = await request(app)
        .get('/v1/api/users/me')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('05');
    });

    it('should return 404 when user is inactive', async () => {
      const mockToken = 'valid-token';
      const inactiveUser = { ...mockStudentUser, isActive: false };
      mockVerifyToken.mockReturnValue({
        userId: mockStudentUser.userId,
        email: mockStudentUser.email,
        role: 'student',
      });

      mockUserRepository.findById.mockResolvedValue(inactiveUser);

      const response = await request(app)
        .get('/v1/api/users/me')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('05');
    });

    it('should return 401 when token is invalid', async () => {
      mockVerifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .get('/v1/api/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});

