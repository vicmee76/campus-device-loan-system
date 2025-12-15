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

export interface LoanDto {
  loanId: string;
  reservationId: string;
  collectedAt: Date;
  returnedAt?: Date | null;
}

export interface LoanUserDetails {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'staff';
}

export interface LoanDeviceDetails {
  deviceId: string;
  brand: string;
  model: string;
  category: string;
}

export interface LoanInventoryDetails {
  inventoryId: string;
  serialNumber: string;
  isAvailable: boolean;
}

export interface LoanReservationDetails {
  reservedAt: Date;
  dueDate: Date;
  status: string;
}

export interface LoanWithDetailsDto extends LoanDto {
  reservation: LoanReservationDetails;
  user: LoanUserDetails;
  device: LoanDeviceDetails;
  inventory: LoanInventoryDetails;
}

