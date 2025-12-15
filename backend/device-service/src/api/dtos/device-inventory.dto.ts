export interface DeviceInventoryDto {
  inventoryId: string; // UUID
  deviceId: string; // UUID
  serialNumber: string;
  isAvailable: boolean;
  createdAt: Date;
}

export interface DeviceInventoryWithDeviceDto extends DeviceInventoryDto {
  device: {
    deviceId: string;
    brand: string;
    model: string;
    category: string;
    description: string | null;
    defaultLoanDurationDays: number;
    createdAt: Date;
    isDeleted: boolean;
  };
}

export interface CreateDeviceInventoryDto {
  deviceId: string;
  serialNumber: string;
  isAvailable?: boolean;
}

export interface UpdateDeviceInventoryDto {
  deviceId?: string;
  serialNumber?: string;
  isAvailable?: boolean;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

