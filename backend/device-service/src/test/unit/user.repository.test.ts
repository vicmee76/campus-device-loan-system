/// <reference types="jest" />
import { UserRepository } from '../../api/repository/user.repository';
import db from '../../database/connection';
import UserFactory from '../../api/factory/user.factory';

jest.mock('../../database/connection');
jest.mock('../../api/factory/user.factory');

describe('UserRepository', () => {
  let repository: UserRepository;
  let mockQuery: any;
  let mockDb: jest.MockedFunction<any>;

  const createThenable = (value: any) => {
    const thenable = {
      where: jest.fn().mockReturnThis(),
      whereILike: jest.fn().mockReturnThis(),
      first: jest.fn(),
      count: jest.fn().mockReturnThis(),
      clone: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      then: jest.fn((resolve) => Promise.resolve(value).then(resolve)),
      catch: jest.fn(),
    };
    return thenable;
  };

  beforeEach(() => {
    repository = new UserRepository();
    mockQuery = createThenable([]);
    mockDb = db as jest.MockedFunction<any>;
    mockDb.mockReturnValue(mockQuery);
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return user DTO when user exists', async () => {
      const mockUser = {
        user_id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'student',
        created_at: new Date(),
        is_active: true,
        is_deleted: false,
      };
      const mockUserDto = {
        userId: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'student',
        createdAt: new Date(),
        isActive: true,
        isDeleted: false,
      };

      mockQuery.first.mockResolvedValue(mockUser);
      (UserFactory.toDto as jest.Mock).mockReturnValue(mockUserDto);

      const result = await repository.findById('user-123');

      expect(mockDb).toHaveBeenCalledWith('users');
      expect(mockQuery.where).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockQuery.where).toHaveBeenCalledWith('is_deleted', false);
      expect(UserFactory.toDto).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUserDto);
    });

    it('should return null when user does not exist', async () => {
      mockQuery.first.mockResolvedValue(undefined);

      const result = await repository.findById('user-123');

      expect(result).toBeNull();
      expect(UserFactory.toDto).not.toHaveBeenCalled();
    });

    it('should include deleted users when includeDeleted is true', async () => {
      const mockUser = {
        user_id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'student',
        created_at: new Date(),
        is_active: true,
        is_deleted: true,
      };
      const mockUserDto = {
        userId: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'student',
        createdAt: new Date(),
        isActive: true,
        isDeleted: true,
      };

      mockQuery.first.mockResolvedValue(mockUser);
      (UserFactory.toDto as jest.Mock).mockReturnValue(mockUserDto);

      const result = await repository.findById('user-123', true);

      expect(mockQuery.where).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockQuery.where).not.toHaveBeenCalledWith('is_deleted', false);
      expect(result).toEqual(mockUserDto);
    });
  });

  describe('findByEmailWithPassword', () => {
    it('should return user table when user exists', async () => {
      const mockUser = {
        user_id: 'user-123',
        email: 'test@example.com',
        password: 'hashed-password',
        first_name: 'John',
        last_name: 'Doe',
        role: 'student',
        created_at: new Date(),
        is_active: true,
        is_deleted: false,
      };

      mockQuery.first.mockResolvedValue(mockUser);

      const result = await repository.findByEmailWithPassword('test@example.com');

      expect(mockDb).toHaveBeenCalledWith('users');
      expect(mockQuery.where).toHaveBeenCalledWith('email', 'test@example.com');
      expect(mockQuery.where).toHaveBeenCalledWith('is_deleted', false);
      expect(mockQuery.where).toHaveBeenCalledWith('is_active', true);
      expect(result).toEqual(mockUser);
    });

    it('should return null when user does not exist', async () => {
      mockQuery.first.mockResolvedValue(undefined);

      const result = await repository.findByEmailWithPassword('test@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return paginated users with default options', async () => {
      const mockUsers = [
        {
          user_id: 'user-1',
          email: 'user1@example.com',
          first_name: 'John',
          last_name: 'Doe',
          role: 'student',
          created_at: new Date(),
          is_active: true,
          is_deleted: false,
        },
        {
          user_id: 'user-2',
          email: 'user2@example.com',
          first_name: 'Jane',
          last_name: 'Smith',
          role: 'staff',
          created_at: new Date(),
          is_active: true,
          is_deleted: false,
        },
      ];
      const mockUserDtos = [
        {
          userId: 'user-1',
          email: 'user1@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'student',
          createdAt: new Date(),
          isActive: true,
          isDeleted: false,
        },
        {
          userId: 'user-2',
          email: 'user2@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'staff',
          createdAt: new Date(),
          isActive: true,
          isDeleted: false,
        },
      ];

      const mockCountQuery = createThenable({ count: '2' });
      mockCountQuery.first = jest.fn().mockResolvedValue({ count: '2' });
      const mockDataQuery = createThenable(mockUsers);
      
      mockQuery.clone.mockReturnValueOnce(mockCountQuery);
      mockQuery.clone.mockReturnValueOnce(mockDataQuery);
      (UserFactory.toDtoArray as jest.Mock).mockReturnValue(mockUserDtos);

      const result = await repository.findAll();

      expect(mockDb).toHaveBeenCalledWith('users');
      expect(mockQuery.where).toHaveBeenCalledWith('is_deleted', false);
      expect(mockQuery.clone).toHaveBeenCalledTimes(2);
      expect(mockDataQuery.orderBy).toHaveBeenCalledWith('created_at', 'desc');
      expect(UserFactory.toDtoArray).toHaveBeenCalledWith(mockUsers);
      expect(result.data).toEqual(mockUserDtos);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pageSize).toBe(10);
      expect(result.pagination.totalCount).toBe(2);
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.hasPreviousPage).toBe(false);
    });

    it('should filter by role', async () => {
      const mockCountQuery = createThenable({ count: '1' });
      mockCountQuery.first = jest.fn().mockResolvedValue({ count: '1' });
      const mockDataQuery = createThenable([]);
      
      mockQuery.clone.mockReturnValueOnce(mockCountQuery);
      mockQuery.clone.mockReturnValueOnce(mockDataQuery);
      (UserFactory.toDtoArray as jest.Mock).mockReturnValue([]);

      await repository.findAll({ role: 'student' });

      expect(mockQuery.where).toHaveBeenCalledWith('role', 'student');
    });

    it('should filter by isActive', async () => {
      const mockCountQuery = createThenable({ count: '0' });
      mockCountQuery.first = jest.fn().mockResolvedValue({ count: '0' });
      const mockDataQuery = createThenable([]);
      
      mockQuery.clone.mockReturnValueOnce(mockCountQuery);
      mockQuery.clone.mockReturnValueOnce(mockDataQuery);
      (UserFactory.toDtoArray as jest.Mock).mockReturnValue([]);

      await repository.findAll({ isActive: true });

      expect(mockQuery.where).toHaveBeenCalledWith('is_active', true);
    });

    it('should include deleted users when includeDeleted is true', async () => {
      const mockCountQuery = createThenable({ count: '0' });
      mockCountQuery.first = jest.fn().mockResolvedValue({ count: '0' });
      const mockDataQuery = createThenable([]);
      
      mockQuery.clone.mockReturnValueOnce(mockCountQuery);
      mockQuery.clone.mockReturnValueOnce(mockDataQuery);
      (UserFactory.toDtoArray as jest.Mock).mockReturnValue([]);

      await repository.findAll({ includeDeleted: true });

      expect(mockQuery.where).not.toHaveBeenCalledWith('is_deleted', false);
    });

    it('should filter by firstName', async () => {
      const mockCountQuery = createThenable({ count: '0' });
      mockCountQuery.first = jest.fn().mockResolvedValue({ count: '0' });
      const mockDataQuery = createThenable([]);
      
      mockQuery.clone.mockReturnValueOnce(mockCountQuery);
      mockQuery.clone.mockReturnValueOnce(mockDataQuery);
      (UserFactory.toDtoArray as jest.Mock).mockReturnValue([]);

      await repository.findAll({ firstName: 'John' });

      expect(mockQuery.whereILike).toHaveBeenCalledWith('first_name', '%John%');
    });

    it('should filter by lastName', async () => {
      const mockCountQuery = createThenable({ count: '0' });
      mockCountQuery.first = jest.fn().mockResolvedValue({ count: '0' });
      const mockDataQuery = createThenable([]);
      
      mockQuery.clone.mockReturnValueOnce(mockCountQuery);
      mockQuery.clone.mockReturnValueOnce(mockDataQuery);
      (UserFactory.toDtoArray as jest.Mock).mockReturnValue([]);

      await repository.findAll({ lastName: 'Doe' });

      expect(mockQuery.whereILike).toHaveBeenCalledWith('last_name', '%Doe%');
    });

    it('should filter by email', async () => {
      const mockCountQuery = createThenable({ count: '0' });
      mockCountQuery.first = jest.fn().mockResolvedValue({ count: '0' });
      const mockDataQuery = createThenable([]);
      
      mockQuery.clone.mockReturnValueOnce(mockCountQuery);
      mockQuery.clone.mockReturnValueOnce(mockDataQuery);
      (UserFactory.toDtoArray as jest.Mock).mockReturnValue([]);

      await repository.findAll({ email: 'test@example.com' });

      expect(mockQuery.whereILike).toHaveBeenCalledWith('email', '%test@example.com%');
    });

    it('should apply pagination when page and pageSize are provided', async () => {
      const mockCountQuery = createThenable({ count: '25' });
      mockCountQuery.first = jest.fn().mockResolvedValue({ count: '25' });
      const mockDataQuery = createThenable([]);
      
      mockQuery.clone.mockReturnValueOnce(mockCountQuery);
      mockQuery.clone.mockReturnValueOnce(mockDataQuery);
      (UserFactory.toDtoArray as jest.Mock).mockReturnValue([]);

      const result = await repository.findAll({ page: 2, pageSize: 10 });

      expect(mockDataQuery.limit).toHaveBeenCalledWith(10);
      expect(mockDataQuery.offset).toHaveBeenCalledWith(10);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.pageSize).toBe(10);
      expect(result.pagination.totalCount).toBe(25);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.hasPreviousPage).toBe(true);
    });

    it('should handle pagination on first page', async () => {
      const mockCountQuery = createThenable({ count: '15' });
      mockCountQuery.first = jest.fn().mockResolvedValue({ count: '15' });
      const mockDataQuery = createThenable([]);
      
      mockQuery.clone.mockReturnValueOnce(mockCountQuery);
      mockQuery.clone.mockReturnValueOnce(mockDataQuery);
      (UserFactory.toDtoArray as jest.Mock).mockReturnValue([]);

      const result = await repository.findAll({ page: 1, pageSize: 10 });

      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.hasPreviousPage).toBe(false);
    });
  });
});

