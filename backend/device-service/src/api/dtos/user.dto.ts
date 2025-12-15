export interface UserDto {
  userId: string; // UUID
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'staff';
  createdAt: Date;
  isActive: boolean;
  isDeleted: boolean;
}

/**
 * DTO for creating a new user
 * isActive defaults to true, isDeleted defaults to false
 */
export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'staff';
}

/**
 * DTO for updating a user
 * All fields are optional except userId
 */
export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: 'student' | 'staff';
  isActive?: boolean;
}

/**
 * DTO for user login
 */
export interface LoginDto {
  email: string;
  password: string;
}

/**
 * DTO for login response
 */
export interface LoginResponseDto {
  token: string;
  user: UserDto;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

