export interface UserDto {
  UserId: string; // UUID
  Email: string;
  FirstName: string;
  LastName: string;
  Role: 'student' | 'staff';
  CreatedAt: Date;
  IsActive: boolean;
  IsDeleted: boolean;
}

/**
 * DTO for creating a new user
 * IsActive defaults to true, IsDeleted defaults to false
 */
export interface CreateUserDto {
  Email: string;
  Password: string;
  FirstName: string;
  LastName: string;
  Role: 'student' | 'staff';
}

/**
 * DTO for updating a user
 * All fields are optional except UserId
 * Note: Password updates should use UpdatePasswordDto
 */
export interface UpdateUserDto {
  Email?: string;
  FirstName?: string;
  LastName?: string;
  Role?: 'student' | 'staff';
  IsActive?: boolean;
}

/**
 * DTO for updating user password
 */
export interface UpdatePasswordDto {
  Password: string;
}

