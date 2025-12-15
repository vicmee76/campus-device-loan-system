import { PaginationMeta, PaginatedResult } from './user.dto';

export interface WaitlistDto {
  waitlistId: string; // UUID
  userId: string; // UUID
  deviceId: string; // UUID
  addedAt: Date;
  isNotified: boolean;
  notifiedAt: Date | null;
}

export interface WaitlistUserDetails {
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'staff';
}

export interface WaitlistDeviceDetails {
  brand: string;
  model: string;
  category: string;
}

export interface WaitlistWithDetailsDto extends WaitlistDto {
  user: WaitlistUserDetails;
  device: WaitlistDeviceDetails;
}

export interface JoinWaitlistResponseDto {
  waitlistId: string;
  userId: string;
  deviceId: string;
  addedAt: Date;
  position: number;
}

export { PaginationMeta, PaginatedResult };

