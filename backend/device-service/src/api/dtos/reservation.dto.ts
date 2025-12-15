import { PaginationMeta, PaginatedResult } from './user.dto';

export interface ReservationDto {
  reservationId: string; // UUID
  userId: string; // UUID
  deviceId: string; // UUID
  inventoryId: string; // UUID
  reservedAt: Date;
  dueDate: Date;
  status: string;
}

export interface ReservationUserDetails {
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'staff';
}

export interface ReservationDeviceDetails {
  brand: string;
  model: string;
  category: string;
}

export interface ReservationInventoryDetails {
  serialNumber: string;
  isAvailable: boolean;
}

export interface ReservationWithDetailsDto extends ReservationDto {
  user: ReservationUserDetails;
  device: ReservationDeviceDetails;
  inventory: ReservationInventoryDetails;
}

export { PaginationMeta, PaginatedResult };



