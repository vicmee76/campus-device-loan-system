/// <reference types="jest" />

import UserFactory from '../../api/factory/user.factory';
import { UserTable } from '../../api/model/user.model';
import { UserDto, CreateUserDto } from '../../api/dtos/user.dto';

describe('UserFactory - Unit Tests', () => {
  const mockUserTable: UserTable = {
    user_id: 'user-123',
    email: 'test@example.com',
    password: 'hashed-password',
    first_name: 'John',
    last_name: 'Doe',
    role: 'student',
    created_at: new Date('2024-01-01'),
    is_active: true,
    is_deleted: false,
  };

  const mockUserDto: UserDto = {
    userId: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'student',
    createdAt: new Date('2024-01-01'),
    isActive: true,
    isDeleted: false,
  };

  describe('toDto', () => {
    it('should convert UserTable to UserDto correctly', () => {
      const result = UserFactory.toDto(mockUserTable);

      expect(result).toEqual(mockUserDto);
      expect(result.userId).toBe(mockUserTable.user_id);
      expect(result.email).toBe(mockUserTable.email);
      expect(result.firstName).toBe(mockUserTable.first_name);
      expect(result.lastName).toBe(mockUserTable.last_name);
      expect(result.role).toBe(mockUserTable.role);
      expect(result.createdAt).toBe(mockUserTable.created_at);
      expect(result.isActive).toBe(mockUserTable.is_active);
      expect(result.isDeleted).toBe(mockUserTable.is_deleted);
    });

    it('should handle all boolean values correctly', () => {
      const inactiveUser: UserTable = {
        ...mockUserTable,
        is_active: false,
        is_deleted: true,
      };

      const result = UserFactory.toDto(inactiveUser);

      expect(result.isActive).toBe(false);
      expect(result.isDeleted).toBe(true);
    });
  });

  describe('toDtoArray', () => {
    it('should convert array of UserTable to array of UserDto', () => {
      const userTables: UserTable[] = [
        mockUserTable,
        {
          ...mockUserTable,
          user_id: 'user-456',
          email: 'another@example.com',
        },
      ];

      const result = UserFactory.toDtoArray(userTables);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockUserDto);
      expect(result[1].userId).toBe('user-456');
      expect(result[1].email).toBe('another@example.com');
    });

    it('should return empty array for empty input', () => {
      const result = UserFactory.toDtoArray([]);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('toTable', () => {
    it('should convert UserDto to UserTable correctly', () => {
      const result = UserFactory.toTable(mockUserDto);

      expect(result.user_id).toBe(mockUserDto.userId);
      expect(result.email).toBe(mockUserDto.email);
      expect(result.first_name).toBe(mockUserDto.firstName);
      expect(result.last_name).toBe(mockUserDto.lastName);
      expect(result.role).toBe(mockUserDto.role);
      expect(result.created_at).toBe(mockUserDto.createdAt);
      expect(result.is_active).toBe(mockUserDto.isActive);
      expect(result.is_deleted).toBe(mockUserDto.isDeleted);
    });

    it('should handle partial UserDto', () => {
      const partialDto: Partial<UserDto> = {
        email: 'partial@example.com',
        firstName: 'Partial',
      };

      const result = UserFactory.toTable(partialDto);

      expect(result.email).toBe('partial@example.com');
      expect(result.first_name).toBe('Partial');
      expect(result.user_id).toBeUndefined();
    });

    it('should handle password field', () => {
      const dtoWithPassword = {
        ...mockUserDto,
        password: 'new-password',
      };

      const result = UserFactory.toTable(dtoWithPassword);

      expect((result as any).password).toBe('new-password');
    });

    it('should only include defined fields', () => {
      const minimalDto: Partial<UserDto> = {
        userId: 'user-789',
      };

      const result = UserFactory.toTable(minimalDto);

      expect(result.user_id).toBe('user-789');
      expect(result.email).toBeUndefined();
      expect(result.first_name).toBeUndefined();
    });
  });

  describe('createDto', () => {
    it('should create UserDto from CreateUserDto with all fields', () => {
      const createDto: CreateUserDto = {
        email: 'new@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'staff',
        password: 'Password123!',
      };

      const result = UserFactory.createDto(createDto);

      expect(result.email).toBe(createDto.email);
      expect(result.firstName).toBe(createDto.firstName);
      expect(result.lastName).toBe(createDto.lastName);
      expect(result.role).toBe(createDto.role);
      expect(result.isActive).toBe(true);
      expect(result.isDeleted).toBe(false);
      expect(result.userId).toBe('');
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should use provided userId and createdAt if provided', () => {
      const createDto: CreateUserDto = {
        email: 'new@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'staff',
        password: 'Password123!',
      };

      const customUserId = 'custom-user-id';
      const customDate = new Date('2024-06-01');

      const result = UserFactory.createDto({
        ...createDto,
        userId: customUserId,
        createdAt: customDate,
      });

      expect(result.userId).toBe(customUserId);
      expect(result.createdAt).toBe(customDate);
    });

    it('should set default values correctly', () => {
      const createDto: CreateUserDto = {
        email: 'default@example.com',
        firstName: 'Default',
        lastName: 'User',
        role: 'student',
        password: 'Password123!',
      };

      const result = UserFactory.createDto(createDto);

      expect(result.isActive).toBe(true);
      expect(result.isDeleted).toBe(false);
      expect(result.userId).toBe('');
      expect(result.createdAt).toBeInstanceOf(Date);
    });
  });
});

