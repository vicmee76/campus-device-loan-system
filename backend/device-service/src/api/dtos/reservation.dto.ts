import { PaginationMeta, PaginatedResult } from './user.dto';
import { DeviceDto } from './device.dto';
import { DeviceInventoryDto } from './device-inventory.dto';

export interface ReservationDto {
  reservationId: string; // UUID
  userId: string; // UUID
  deviceId: string; // UUID
  inventoryId: string; // UUID
  reservedAt: Date;
  dueDate: Date;
  status: string;
}

export interface ReservationWithDetailsDto extends ReservationDto {
  device: DeviceDto;
  inventory: DeviceInventoryDto;
}

export { PaginationMeta, PaginatedResult };



