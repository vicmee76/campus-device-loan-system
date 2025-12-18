export interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'staff';
  createdAt: string;
  isActive: boolean;
  isDeleted: boolean;
}

export interface Device {
  deviceId: string;
  brand: string;
  model: string;
  category: string;
  specifications: string;
  description: string;
  createdAt: string;
  isDeleted: boolean;
  availableCount?: number;
}

export interface DeviceInventory {
  inventoryId: string;
  deviceId: string;
  serialNumber: string;
  isAvailable: boolean;
  createdAt: string;
}

export interface Reservation {
  reservationId: string;
  userId: string;
  deviceId: string;
  inventoryId: string;
  reservedAt: string;
  dueDate: string;
  status: string;
  user?: User;
  device?: Device;
  inventory?: DeviceInventory;
}

export interface Waitlist {
  waitlistId: string;
  userId: string;
  deviceId: string;
  joinedAt?: string;
  addedAt?: string;
  position?: number;
  device?: Device;
  user?: {
    email: string;
    firstName: string;
    lastName: string;
    role: 'student' | 'staff';
  };
}

export interface Loan {
  loanId: string;
  reservationId: string;
  collectedAt: string;
  dueDate: string;
  returnedAt: string | null;
  status: 'active' | 'returned' | 'collected';
  reservation?: Reservation;
  device?: Device;
  inventory?: DeviceInventory;
  user?: User;
}

export interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data: T | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface EmailNotification {
  emailId: string;
  userId: string;
  emailAddress: string;
  subject: string;
  body: string;
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  errorMessage: string | null;
  sentAt: string | null;
  isRead: boolean;
  createdAt: string;
}


