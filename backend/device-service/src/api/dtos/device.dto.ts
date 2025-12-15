export interface DeviceDto {
  deviceId: string; // UUID
  brand: string;
  model: string;
  category: string;
  description: string | null;
  defaultLoanDurationDays: number;
  createdAt: Date;
  isDeleted: boolean;
}

/**
 * DTO for creating a new device
 */
export interface CreateDeviceDto {
  brand: string;
  model: string;
  category: string;
  description?: string;
  defaultLoanDurationDays?: number;
}

/**
 * DTO for updating a device
 * All fields are optional except deviceId
 */
export interface UpdateDeviceDto {
  brand?: string;
  model?: string;
  category?: string;
  description?: string;
  defaultLoanDurationDays?: number;
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

/**
 * DTO for device list with inventory counts
 */
export interface DeviceWithInventoryDto {
  deviceId: string;
  brand: string;
  model: string;
  category: string;
  description: string | null;
  totalUnits: number;
  availableUnits: number;
}

