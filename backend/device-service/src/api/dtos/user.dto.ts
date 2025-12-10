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

