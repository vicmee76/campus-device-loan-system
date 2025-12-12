# 🔌 API Documentation

Complete API reference for the Campus Device Loan System backend services.

## 📋 Overview

The Campus Device Loan System provides two backend microservices:

- **Device Service** (Port 7778) - Manages devices, users, reservations, and waitlists
- **Loan Service** (Port 7779) - Handles loan lifecycle, returns, and collections

Both services use RESTful API design principles and share a common authentication mechanism using JWT tokens.

### Base URLs

- **Device Service**: `http://localhost:7778`
- **Loan Service**: `http://localhost:7779`

### API Versioning

All endpoints are prefixed with `/v1/api/` to indicate API version 1.

---

## 🔐 Authentication & Authorization

### Authentication Method

The system uses **JWT (JSON Web Token)** based authentication. Tokens are issued by the Device Service during login and validated by both services using a shared `JWT_SECRET`.

### Obtaining a Token

To obtain a JWT token, authenticate using the login endpoint:

```http
POST /v1/api/users/login
```

The response includes a `token` field that must be included in subsequent requests.

### Using the Token

Include the JWT token in the `Authorization` header of all authenticated requests:

```http
Authorization: Bearer <your-jwt-token>
```

**Format**: `Bearer <token>`

### Token Structure

JWT tokens contain the following payload:

```typescript
{
  userId: string;      // UUID of the user
  email: string;       // User's email address
  role: 'student' | 'staff';  // User role
}
```

### Authorization Roles

The system supports two roles:

- **Student** (`student`) - Can reserve devices, join waitlists, and view their own data
- **Staff** (`staff`) - Full access including viewing all users, reservations, loans, and managing collections/returns

### Middleware

- `authenticate` - Validates JWT token and attaches user information to request
- `requireStaff` - Ensures the authenticated user has staff role
- `requireStudent` - Ensures the authenticated user has student role

### Token Expiration

Token expiration is configured via the `JWT_EXPIRES_IN` environment variable (e.g., "24h"). Expired tokens will return a `401 Unauthorized` response.

---

## 📊 HTTP Status Codes

The API uses standard HTTP status codes:

| Status Code | Meaning | Description |
|------------|---------|-------------|
| `200` | OK | Request successful |
| `201` | Created | Resource created successfully |
| `400` | Bad Request | Validation error or invalid request |
| `401` | Unauthorized | Authentication required or token invalid/expired |
| `403` | Forbidden | Insufficient permissions (role-based access denied) |
| `404` | Not Found | Resource not found |
| `409` | Conflict | Resource conflict (e.g., already on waitlist, no available devices) |
| `500` | Internal Server Error | Server error occurred |

---

## 📦 Response Format

All API responses follow a consistent structure:

```typescript
{
  success: boolean;    // true for success, false for errors
  code: string;        // Response code (see below)
  message: string;     // Human-readable message
  data: T | null;      // Response data (null on error)
}
```

### Response Codes

| Code | Meaning | HTTP Status |
|------|---------|-------------|
| `00` | Success | 200/201 |
| `05` | Not Found | 404 |
| `09` | Validation Error | 400 |
| `06` | General Error | 500 |

### Success Response Example

```json
{
  "success": true,
  "code": "00",
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

### Error Response Example

```json
{
  "success": false,
  "code": "09",
  "message": "Validation error: email is required",
  "data": null
}
```

### Paginated Responses

Endpoints that return lists support pagination and return:

```typescript
{
  success: true,
  code: "00",
  message: "Operation successful",
  data: {
    data: T[];           // Array of items
    pagination: {
      page: number;      // Current page (1-indexed)
      pageSize: number;  // Items per page
      totalCount: number; // Total number of items
      totalPages: number; // Total number of pages
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    }
  }
}
```

**Query Parameters for Pagination**:
- `page` (optional) - Page number (default: 1)
- `pageSize` (optional) - Items per page (default: 10)

---

## 🖥️ Device Service Endpoints

**Base URL**: `http://localhost:7778`

### Health & Monitoring

#### GET `/health`
Liveness probe endpoint.

**Authentication**: Not required

**Response**:
```json
{
  "status": "ok"
}
```

#### GET `/ready`
Readiness probe endpoint (checks database connectivity).

**Authentication**: Not required

**Response**:
```json
{
  "ready": true
}
```

**Error Response** (500):
```json
{
  "ready": false,
  "error": "Database unreachable"
}
```

#### GET `/metrics`
Prometheus-style metrics endpoint.

**Authentication**: Not required

**Response**: Plain text metrics

---

### User Endpoints

#### POST `/v1/api/users/login`
Authenticate a user and receive a JWT token.

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Validation Rules**:
- `email`: required, valid email format, max 255 characters
- `password`: required, string

**Success Response** (200):
```json
{
  "success": true,
  "code": "00",
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "isActive": true,
      "isDeleted": false
    }
  }
}
```

**Error Responses**:
- `400` - Validation error
- `404` - Invalid email or password, user inactive, or user not found

---

#### GET `/v1/api/users/get-all-users`
Get paginated list of all users.

**Authentication**: Required (Staff only)

**Query Parameters**:
- `page` (optional) - Page number (default: 1)
- `pageSize` (optional) - Items per page (default: 10)
- `role` (optional) - Filter by role: `student` or `staff`
- `isActive` (optional) - Filter by active status: `true` or `false`
- `includeDeleted` (optional) - Include deleted users: `true` or `false`
- `firstName` (optional) - Filter by first name
- `lastName` (optional) - Filter by last name
- `email` (optional) - Filter by email

**Success Response** (200):
```json
{
  "success": true,
  "code": "00",
  "message": "Users retrieved successfully",
  "data": {
    "data": [
      {
        "userId": "uuid",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "student",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "isActive": true,
        "isDeleted": false
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalCount": 50,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

**Error Responses**:
- `401` - Not authenticated
- `403` - Not staff role
- `500` - Server error

---

#### GET `/v1/api/users/get-user-by-id/:id`
Get a specific user by ID.

**Authentication**: Required (Staff only)

**Path Parameters**:
- `id` - User UUID

**Query Parameters**:
- `includeDeleted` (optional) - Include deleted users: `true` or `false`

**Success Response** (200):
```json
{
  "success": true,
  "code": "00",
  "message": "User retrieved successfully",
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "isActive": true,
    "isDeleted": false
  }
}
```

**Error Responses**:
- `400` - User ID is required
- `401` - Not authenticated
- `403` - Not staff role
- `404` - User not found
- `500` - Server error

---

#### GET `/v1/api/users/me`
Get the current authenticated user's information.

**Authentication**: Required

**Success Response** (200):
```json
{
  "success": true,
  "code": "00",
  "message": "Current user retrieved successfully",
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "isActive": true,
    "isDeleted": false
  }
}
```

**Error Responses**:
- `401` - Not authenticated or user not found
- `500` - Server error

---

### Device Endpoints

#### GET `/v1/api/devices/get-all-devices`
Get paginated list of all devices.

**Authentication**: Not required

**Query Parameters**:
- `page` (optional) - Page number (default: 1)
- `pageSize` (optional) - Items per page (default: 10)
- `search` (optional) - Search term (searches brand, model, category)

**Success Response** (200):
```json
{
  "success": true,
  "code": "00",
  "message": "Devices retrieved successfully",
  "data": {
    "data": [
      {
        "deviceId": "uuid",
        "brand": "Apple",
        "model": "MacBook Pro",
        "category": "Laptop",
        "specifications": "16GB RAM, 512GB SSD",
        "description": "High-performance laptop",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "isDeleted": false
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalCount": 25,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

---

#### GET `/v1/api/devices/get-device-by-id/:id`
Get a specific device by ID.

**Authentication**: Not required

**Path Parameters**:
- `id` - Device UUID

**Success Response** (200):
```json
{
  "success": true,
  "code": "00",
  "message": "Device retrieved successfully",
  "data": {
    "deviceId": "uuid",
    "brand": "Apple",
    "model": "MacBook Pro",
    "category": "Laptop",
    "specifications": "16GB RAM, 512GB SSD",
    "description": "High-performance laptop",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "isDeleted": false
  }
}
```

**Error Responses**:
- `400` - Device ID is required
- `404` - Device not found
- `500` - Server error

---

#### GET `/v1/api/devices/available-devices`
Get paginated list of devices that have available inventory.

**Authentication**: Required

**Query Parameters**:
- `page` (optional) - Page number (default: 1)
- `pageSize` (optional) - Items per page (default: 10)
- `search` (optional) - Search term

**Success Response** (200):
```json
{
  "success": true,
  "code": "00",
  "message": "Available devices retrieved successfully",
  "data": {
    "data": [
      {
        "deviceId": "uuid",
        "brand": "Apple",
        "model": "MacBook Pro",
        "category": "Laptop",
        "specifications": "16GB RAM, 512GB SSD",
        "description": "High-performance laptop",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "isDeleted": false,
        "availableCount": 5
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalCount": 15,
      "totalPages": 2,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

**Error Responses**:
- `401` - Not authenticated
- `500` - Server error

---

### Device Inventory Endpoints

#### GET `/v1/api/device-inventory/get-all`
Get paginated list of all device inventory items.

**Authentication**: Not required

**Query Parameters**:
- `page` (optional) - Page number (default: 1)
- `pageSize` (optional) - Items per page (default: 10)

**Success Response** (200):
```json
{
  "success": true,
  "code": "00",
  "message": "Inventory retrieved successfully",
  "data": {
    "data": [
      {
        "inventoryId": "uuid",
        "deviceId": "uuid",
        "serialNumber": "SN123456",
        "isAvailable": true,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalCount": 100,
      "totalPages": 10,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

---

#### GET `/v1/api/device-inventory/get-by-id/:id`
Get a specific inventory item by ID.

**Authentication**: Not required

**Path Parameters**:
- `id` - Inventory UUID

**Success Response** (200):
```json
{
  "success": true,
  "code": "00",
  "message": "Inventory retrieved successfully",
  "data": {
    "inventoryId": "uuid",
    "deviceId": "uuid",
    "serialNumber": "SN123456",
    "isAvailable": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### GET `/v1/api/device-inventory/get-by-device-id/:deviceId`
Get all inventory items for a specific device.

**Authentication**: Not required

**Path Parameters**:
- `deviceId` - Device UUID

**Success Response** (200):
```json
{
  "success": true,
  "code": "00",
  "message": "Inventory retrieved successfully",
  "data": [
    {
      "inventoryId": "uuid",
      "deviceId": "uuid",
      "serialNumber": "SN123456",
      "isAvailable": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Reservation Endpoints

#### POST `/v1/api/reservations/:deviceId/reserve`
Reserve a device. Automatically assigns an available inventory item.

**Authentication**: Required

**Path Parameters**:
- `deviceId` - Device UUID to reserve

**Success Response** (201):
```json
{
  "success": true,
  "code": "00",
  "message": "Reservation successful.",
  "data": {
    "reservationId": "uuid",
    "userId": "uuid",
    "deviceId": "uuid",
    "inventoryId": "uuid",
    "reservedAt": "2024-01-01T00:00:00.000Z",
    "dueDate": "2024-01-08T00:00:00.000Z",
    "status": "pending"
  }
}
```

**Error Responses**:
- `400` - User ID or Device ID is required
- `401` - Not authenticated
- `409` - No available devices for this model (should join waitlist)
- `500` - Server error

**Note**: If no devices are available, the response will have status `409` with message indicating to join the waitlist.

---

#### PATCH `/v1/api/reservations/:reservationId/cancel`
Cancel a reservation. Only the reservation owner can cancel.

**Authentication**: Required

**Path Parameters**:
- `reservationId` - Reservation UUID to cancel

**Success Response** (200):
```json
{
  "success": true,
  "code": "00",
  "message": "Reservation cancelled successfully",
  "data": {
    "reservationId": "uuid",
    "userId": "uuid",
    "deviceId": "uuid",
    "inventoryId": "uuid",
    "reservedAt": "2024-01-01T00:00:00.000Z",
    "dueDate": "2024-01-08T00:00:00.000Z",
    "status": "cancelled"
  }
}
```

**Error Responses**:
- `400` - User ID or Reservation ID is required
- `401` - Not authenticated
- `404` - Reservation not found
- `403` - Can only cancel your own reservations
- `400` - Reservation is already cancelled
- `500` - Server error

---

#### GET `/v1/api/reservations/get-all`
Get paginated list of all reservations (with details).

**Authentication**: Required (Staff only)

**Query Parameters**:
- `page` (optional) - Page number (default: 1)
- `pageSize` (optional) - Items per page (default: 10)

**Success Response** (200):
```json
{
  "success": true,
  "code": "00",
  "message": "Reservations retrieved successfully",
  "data": {
    "data": [
      {
        "reservationId": "uuid",
        "userId": "uuid",
        "deviceId": "uuid",
        "inventoryId": "uuid",
        "reservedAt": "2024-01-01T00:00:00.000Z",
        "dueDate": "2024-01-08T00:00:00.000Z",
        "status": "pending",
        "user": {
          "email": "user@example.com",
          "firstName": "John",
          "lastName": "Doe",
          "role": "student"
        },
        "device": {
          "brand": "Apple",
          "model": "MacBook Pro",
          "category": "Laptop"
        },
        "inventory": {
          "serialNumber": "SN123456",
          "isAvailable": false
        }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalCount": 50,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

**Error Responses**:
- `401` - Not authenticated
- `403` - Not staff role
- `500` - Server error

---

#### GET `/v1/api/reservations/get-by-user-id/:userId`
Get all reservations for a specific user.

**Authentication**: Required (Staff only)

**Path Parameters**:
- `userId` - User UUID

**Success Response** (200):
```json
{
  "success": true,
  "code": "00",
  "message": "Reservations retrieved successfully",
  "data": [
    {
      "reservationId": "uuid",
      "userId": "uuid",
      "deviceId": "uuid",
      "inventoryId": "uuid",
      "reservedAt": "2024-01-01T00:00:00.000Z",
      "dueDate": "2024-01-08T00:00:00.000Z",
      "status": "pending",
      "user": {
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "student"
      },
      "device": {
        "brand": "Apple",
        "model": "MacBook Pro",
        "category": "Laptop"
      },
      "inventory": {
        "serialNumber": "SN123456",
        "isAvailable": false
      }
    }
  ]
}
```

**Error Responses**:
- `400` - User ID is required
- `401` - Not authenticated
- `403` - Not staff role
- `500` - Server error

---

#### GET `/v1/api/reservations/get-by-device-id/:deviceId`
Get all reservations for a specific device.

**Authentication**: Required (Staff only)

**Path Parameters**:
- `deviceId` - Device UUID

**Success Response** (200):
```json
{
  "success": true,
  "code": "00",
  "message": "Reservations retrieved successfully",
  "data": [
    {
      "reservationId": "uuid",
      "userId": "uuid",
      "deviceId": "uuid",
      "inventoryId": "uuid",
      "reservedAt": "2024-01-01T00:00:00.000Z",
      "dueDate": "2024-01-08T00:00:00.000Z",
      "status": "pending",
      "user": {
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "student"
      },
      "device": {
        "brand": "Apple",
        "model": "MacBook Pro",
        "category": "Laptop"
      },
      "inventory": {
        "serialNumber": "SN123456",
        "isAvailable": false
      }
    }
  ]
}
```

**Error Responses**:
- `400` - Device ID is required
- `401` - Not authenticated
- `403` - Not staff role
- `500` - Server error

---

#### GET `/v1/api/reservations/me`
Get the current authenticated user's reservations.

**Authentication**: Required

**Query Parameters**:
- `page` (optional) - Page number (default: 1)
- `pageSize` (optional) - Items per page (default: 10)

**Success Response** (200):
```json
{
  "success": true,
  "code": "00",
  "message": "Reservations retrieved successfully",
  "data": {
    "data": [
      {
        "reservationId": "uuid",
        "userId": "uuid",
        "deviceId": "uuid",
        "inventoryId": "uuid",
        "reservedAt": "2024-01-01T00:00:00.000Z",
        "dueDate": "2024-01-08T00:00:00.000Z",
        "status": "pending"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalCount": 5,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

**Error Responses**:
- `401` - Not authenticated
- `500` - Server error

---

### Waitlist Endpoints

#### POST `/v1/api/waitlist/:deviceId/join`
Join the waitlist for a device.

**Authentication**: Required

**Path Parameters**:
- `deviceId` - Device UUID

**Success Response** (200):
```json
{
  "success": true,
  "code": "00",
  "message": "Added to waitlist successfully",
  "data": {
    "waitlistId": "uuid",
    "userId": "uuid",
    "deviceId": "uuid",
    "joinedAt": "2024-01-01T00:00:00.000Z",
    "position": 3
  }
}
```

**Error Responses**:
- `400` - User ID or Device ID is required
- `401` - Not authenticated
- `409` - Already on waitlist for this device
- `500` - Server error

---

#### DELETE `/v1/api/waitlist/:deviceId/remove`
Remove yourself from a device waitlist.

**Authentication**: Required

**Path Parameters**:
- `deviceId` - Device UUID

**Success Response** (200):
```json
{
  "success": true,
  "code": "00",
  "message": "Removed from waitlist successfully",
  "data": null
}
```

**Error Responses**:
- `400` - User ID or Device ID is required
- `401` - Not authenticated
- `404` - Not on this waitlist
- `500` - Server error

---

#### GET `/v1/api/waitlist/get-all`
Get paginated list of all waitlist entries (with details).

**Authentication**: Required (Staff only)

**Query Parameters**:
- `page` (optional) - Page number (default: 1)
- `pageSize` (optional) - Items per page (default: 10)

**Success Response** (200):
```json
{
  "success": true,
  "code": "00",
  "message": "Waitlist retrieved successfully",
  "data": {
    "data": [
      {
        "waitlistId": "uuid",
        "userId": "uuid",
        "deviceId": "uuid",
        "joinedAt": "2024-01-01T00:00:00.000Z",
        "device": {
          "brand": "Apple",
          "model": "MacBook Pro",
          "category": "Laptop"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalCount": 20,
      "totalPages": 2,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

**Error Responses**:
- `401` - Not authenticated
- `403` - Not staff role
- `500` - Server error

---

#### GET `/v1/api/waitlist/get-by-user-id/:userId`
Get all waitlist entries for a specific user.

**Authentication**: Required (Staff only)

**Path Parameters**:
- `userId` - User UUID

**Success Response** (200):
```json
{
  "success": true,
  "code": "00",
  "message": "Waitlist retrieved successfully",
  "data": [
    {
      "waitlistId": "uuid",
      "userId": "uuid",
      "deviceId": "uuid",
      "joinedAt": "2024-01-01T00:00:00.000Z",
      "device": {
        "brand": "Apple",
        "model": "MacBook Pro",
        "category": "Laptop"
      }
    }
  ]
}
```

**Error Responses**:
- `400` - User ID is required
- `401` - Not authenticated
- `403` - Not staff role
- `500` - Server error

---

#### GET `/v1/api/waitlist/get-by-device-id/:deviceId`
Get all waitlist entries for a specific device (ordered by join time).

**Authentication**: Required (Staff only)

**Path Parameters**:
- `deviceId` - Device UUID

**Success Response** (200):
```json
{
  "success": true,
  "code": "00",
  "message": "Waitlist retrieved successfully",
  "data": [
    {
      "waitlistId": "uuid",
      "userId": "uuid",
      "deviceId": "uuid",
      "joinedAt": "2024-01-01T00:00:00.000Z",
      "device": {
        "brand": "Apple",
        "model": "MacBook Pro",
        "category": "Laptop"
      }
    }
  ]
}
```

**Error Responses**:
- `400` - Device ID is required
- `401` - Not authenticated
- `403` - Not staff role
- `500` - Server error

---

#### GET `/v1/api/waitlist/my-waitlist`
Get the current authenticated user's waitlist entries.

**Authentication**: Required

**Success Response** (200):
```json
{
  "success": true,
  "code": "00",
  "message": "My waitlist retrieved successfully",
  "data": [
    {
      "waitlistId": "uuid",
      "userId": "uuid",
      "deviceId": "uuid",
      "joinedAt": "2024-01-01T00:00:00.000Z",
      "device": {
        "brand": "Apple",
        "model": "MacBook Pro",
        "category": "Laptop"
      }
    }
  ]
}
```

**Error Responses**:
- `400` - User ID is required
- `401` - Not authenticated
- `500` - Server error

---

## 💰 Loan Service Endpoints

**Base URL**: `http://localhost:7779`

### Health & Monitoring

#### GET `/health`
Liveness probe endpoint.

**Authentication**: Not required

**Response**:
```json
{
  "status": "ok"
}
```

#### GET `/ready`
Readiness probe endpoint (checks database connectivity).

**Authentication**: Not required

**Response**:
```json
{
  "ready": true
}
```

**Error Response** (500):
```json
{
  "ready": false,
  "error": "Database unreachable"
}
```

#### GET `/metrics`
Prometheus-style metrics endpoint.

**Authentication**: Not required

**Response**: Plain text metrics

---

### Loan Endpoints

#### PATCH `/v1/api/loans/:reservationId/collect`
Mark a reservation as collected and create a loan record. This is called when a user physically collects their reserved device.

**Authentication**: Required (Staff only)

**Path Parameters**:
- `reservationId` - Reservation UUID

**Success Response** (200):
```json
{
  "success": true,
  "code": "00",
  "message": "Loan collected successfully",
  "data": {
    "loanId": "uuid",
    "reservationId": "uuid",
    "collectedAt": "2024-01-01T00:00:00.000Z",
    "dueDate": "2024-01-08T00:00:00.000Z",
    "returnedAt": null,
    "status": "active"
  }
}
```

**Error Responses**:
- `401` - Not authenticated
- `403` - Not staff role
- `404` - Reservation not found
- `400` - Reservation status must be "pending" to collect
- `400` - Loan already exists for this reservation
- `500` - Server error

---

#### PATCH `/v1/api/loans/:loanId/return`
Mark a loan as returned, update inventory availability, and notify waitlist members if applicable.

**Authentication**: Required (Staff only)

**Path Parameters**:
- `loanId` - Loan UUID

**Success Response** (200):
```json
{
  "success": true,
  "code": "00",
  "message": "Loan returned successfully",
  "data": {
    "loanId": "uuid",
    "reservationId": "uuid",
    "collectedAt": "2024-01-01T00:00:00.000Z",
    "dueDate": "2024-01-08T00:00:00.000Z",
    "returnedAt": "2024-01-05T00:00:00.000Z",
    "status": "returned"
  }
}
```

**Error Responses**:
- `401` - Not authenticated
- `403` - Not staff role
- `404` - Loan not found
- `500` - Server error

**Note**: When a device is returned, the system automatically:
1. Updates the inventory item to available
2. Updates the reservation status
3. Notifies the next person on the waitlist (if any)

---

#### GET `/v1/api/loans/get-all-loans`
Get paginated list of all loans with full details (reservation, device, inventory, user).

**Authentication**: Required (Staff only)

**Query Parameters**:
- `page` (optional) - Page number (default: 1)
- `pageSize` (optional) - Items per page (default: 10)

**Success Response** (200):
```json
{
  "success": true,
  "code": "00",
  "message": "Loans retrieved successfully",
  "data": {
    "data": [
      {
        "loanId": "uuid",
        "reservationId": "uuid",
        "collectedAt": "2024-01-01T00:00:00.000Z",
        "dueDate": "2024-01-08T00:00:00.000Z",
        "returnedAt": null,
        "status": "active",
        "reservation": {
          "reservationId": "uuid",
          "userId": "uuid",
          "deviceId": "uuid",
          "inventoryId": "uuid",
          "reservedAt": "2024-01-01T00:00:00.000Z",
          "dueDate": "2024-01-08T00:00:00.000Z",
          "status": "collected"
        },
        "device": {
          "deviceId": "uuid",
          "brand": "Apple",
          "model": "MacBook Pro",
          "category": "Laptop"
        },
        "inventory": {
          "inventoryId": "uuid",
          "serialNumber": "SN123456",
          "isAvailable": false
        },
        "user": {
          "userId": "uuid",
          "email": "user@example.com",
          "firstName": "John",
          "lastName": "Doe",
          "role": "student"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalCount": 30,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

**Error Responses**:
- `401` - Not authenticated
- `403` - Not staff role
- `500` - Server error

---

#### GET `/v1/api/loans/user/:userId`
Get paginated list of loans for a specific user with full details.

**Authentication**: Required (Staff only)

**Path Parameters**:
- `userId` - User UUID

**Query Parameters**:
- `page` (optional) - Page number (default: 1)
- `pageSize` (optional) - Items per page (default: 10)

**Success Response** (200):
```json
{
  "success": true,
  "code": "00",
  "message": "Loans retrieved successfully",
  "data": {
    "data": [
      {
        "loanId": "uuid",
        "reservationId": "uuid",
        "collectedAt": "2024-01-01T00:00:00.000Z",
        "dueDate": "2024-01-08T00:00:00.000Z",
        "returnedAt": null,
        "status": "active",
        "reservation": {
          "reservationId": "uuid",
          "userId": "uuid",
          "deviceId": "uuid",
          "inventoryId": "uuid",
          "reservedAt": "2024-01-01T00:00:00.000Z",
          "dueDate": "2024-01-08T00:00:00.000Z",
          "status": "collected"
        },
        "device": {
          "deviceId": "uuid",
          "brand": "Apple",
          "model": "MacBook Pro",
          "category": "Laptop"
        },
        "inventory": {
          "inventoryId": "uuid",
          "serialNumber": "SN123456",
          "isAvailable": false
        },
        "user": {
          "userId": "uuid",
          "email": "user@example.com",
          "firstName": "John",
          "lastName": "Doe",
          "role": "student"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalCount": 5,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

**Error Responses**:
- `400` - User ID is required
- `401` - Not authenticated
- `403` - Not staff role
- `500` - Server error

---

## 🔒 Required Permissions Summary

### Device Service

| Endpoint | Authentication | Role Required |
|----------|---------------|---------------|
| `POST /v1/api/users/login` | ❌ | None |
| `GET /v1/api/users/get-all-users` | ✅ | Staff |
| `GET /v1/api/users/get-user-by-id/:id` | ✅ | Staff |
| `GET /v1/api/users/me` | ✅ | Any authenticated user |
| `GET /v1/api/devices/get-all-devices` | ❌ | None |
| `GET /v1/api/devices/get-device-by-id/:id` | ❌ | None |
| `GET /v1/api/devices/available-devices` | ✅ | Any authenticated user |
| `GET /v1/api/device-inventory/*` | ❌ | None |
| `POST /v1/api/reservations/:deviceId/reserve` | ✅ | Any authenticated user |
| `PATCH /v1/api/reservations/:reservationId/cancel` | ✅ | Owner only |
| `GET /v1/api/reservations/get-all` | ✅ | Staff |
| `GET /v1/api/reservations/get-by-user-id/:userId` | ✅ | Staff |
| `GET /v1/api/reservations/get-by-device-id/:deviceId` | ✅ | Staff |
| `GET /v1/api/reservations/me` | ✅ | Any authenticated user |
| `POST /v1/api/waitlist/:deviceId/join` | ✅ | Any authenticated user |
| `DELETE /v1/api/waitlist/:deviceId/remove` | ✅ | Owner only |
| `GET /v1/api/waitlist/get-all` | ✅ | Staff |
| `GET /v1/api/waitlist/get-by-user-id/:userId` | ✅ | Staff |
| `GET /v1/api/waitlist/get-by-device-id/:deviceId` | ✅ | Staff |
| `GET /v1/api/waitlist/my-waitlist` | ✅ | Any authenticated user |

### Loan Service

| Endpoint | Authentication | Role Required |
|----------|---------------|---------------|
| `PATCH /v1/api/loans/:reservationId/collect` | ✅ | Staff |
| `PATCH /v1/api/loans/:loanId/return` | ✅ | Staff |
| `GET /v1/api/loans/get-all-loans` | ✅ | Staff |
| `GET /v1/api/loans/user/:userId` | ✅ | Staff |

### Health Endpoints

All health endpoints (`/health`, `/ready`, `/metrics`) are publicly accessible and do not require authentication.

---

## 📝 Notes

### Concurrency Handling

- **Reservations**: The system uses database-level locking to prevent race conditions when multiple users try to reserve the same device simultaneously.
- **Waitlist**: FIFO (First In, First Out) ordering is maintained based on `joinedAt` timestamp.

### Error Handling

- All errors follow the standard response format with appropriate HTTP status codes.
- Validation errors include specific field-level error messages.
- Authentication errors return `401` with clear messages.
- Authorization errors return `403` with role requirements.

### Date Formats

All dates are returned in ISO 8601 format (e.g., `2024-01-01T00:00:00.000Z`).

### UUIDs

All IDs in the system are UUIDs (Universally Unique Identifiers) in standard format.

---

**Last Updated**: December 2024

