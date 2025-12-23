# Test Cases Documentation

This document lists all test cases used for testing across the Campus Device Loan System project.

## Table of Contents
1. [Device Service (Backend)](#device-service-backend)
2. [Loan Service (Backend)](#loan-service-backend)
3. [Frontend](#frontend)

---

## Device Service (Backend)

### Unit Tests

#### Device Service (`device.service.test.ts`)
- **getDeviceById**
  - Should return device when found
  - Should return not found when device does not exist
  - Should return validation error when deviceId is empty
  - Should handle errors gracefully

- **getAllDevices**
  - Should return paginated devices
  - Should handle search parameter
  - Should handle errors gracefully

- **availableDevices**
  - Should return devices with inventory counts
  - Should handle errors gracefully

#### User Service (`user.service.test.ts`)
- **getUserById**
  - Should return user when found
  - Should return not found when user does not exist
  - Should return validation error when userId is empty
  - Should handle errors gracefully

- **getAllUsers**
  - Should return paginated users
  - Should handle errors gracefully

- **login**
  - Should login successfully with valid credentials
  - Should return error when email is missing
  - Should return error when password is missing
  - Should return error when user not found
  - Should return error when password is invalid
  - Should return error when user is inactive
  - Should return error when user is deleted
  - Should handle errors gracefully

- **getCurrentUser**
  - Should return current user when found and active
  - Should return not found when user does not exist
  - Should return not found when user is deleted
  - Should return not found when user is inactive
  - Should return validation error when userId is empty
  - Should handle errors gracefully

#### Reservation Service (`reservation.service.test.ts`)
- **reserveDevice**
  - Should create reservation successfully
  - Should return error when no inventory available
  - Should return validation error when userId is missing
  - Should return validation error when deviceId is missing
  - Should rollback transaction on error

- **reserveDevice - Concurrency Handling**
  - Should handle concurrent reservation requests and prevent double-booking
  - Should handle concurrent requests from same user for different devices
  - Should ensure idempotency - same user cannot reserve same device twice concurrently
  - Should handle race condition when inventory becomes unavailable during transaction
  - Should properly rollback all operations if transaction fails during concurrent requests
  - Should handle high concurrency with multiple devices and users

- **cancelReservation**
  - Should cancel reservation successfully
  - Should return error when reservation not found
  - Should return error when user does not own reservation
  - Should return error when reservation already cancelled
  - Should return error when userId is missing
  - Should return error when reservationId is missing
  - Should return error when updateStatus fails
  - Should handle errors during cancellation

- **getMyReservations**
  - Should get my reservations with pagination successfully
  - Should use default pagination when options not provided
  - Should calculate pagination metadata correctly
  - Should return validation error when userId is empty
  - Should handle errors gracefully

- **getAllReservations**
  - Should return paginated reservations successfully
  - Should use default pagination when not provided
  - Should handle errors gracefully

- **getReservationsByUserId**
  - Should return reservations for user successfully
  - Should return validation error when userId is missing
  - Should handle errors gracefully

- **getReservationsByDeviceId**
  - Should return reservations for device successfully
  - Should return validation error when deviceId is missing
  - Should handle errors gracefully

#### Waitlist Service (`waitlist.service.test.ts`)
- **joinWaitlist**
  - Should join waitlist successfully
  - Should return error when user already on waitlist
  - Should return validation error when userId is missing
  - Should return validation error when deviceId is missing
  - Should handle errors gracefully

- **removeFromWaitlist**
  - Should remove from waitlist successfully
  - Should return not found when user not on waitlist
  - Should return validation error when userId is missing
  - Should return validation error when deviceId is missing
  - Should handle errors gracefully

- **notifyNextUser**
  - Should notify next user successfully
  - Should not notify when no users on waitlist
  - Should not mark as notified when email fails
  - Should handle device not found error gracefully
  - Should handle user not found error gracefully
  - Should handle general errors gracefully

- **getAllWaitlist**
  - Should return paginated waitlist successfully
  - Should use default pagination when not provided
  - Should handle errors gracefully

- **getWaitlistByUserId**
  - Should return waitlist for user successfully
  - Should return validation error when userId is missing
  - Should handle errors gracefully

- **getWaitlistByDeviceId**
  - Should return waitlist for device successfully
  - Should return validation error when deviceId is missing
  - Should handle errors gracefully

- **getMyWaitlist**
  - Should return my waitlist successfully
  - Should return validation error when userId is missing
  - Should handle errors gracefully

#### Device Inventory Service (`device-inventory.service.test.ts`)
- **getDeviceInventoryByDeviceId**
  - Should return inventory with device details
  - Should return validation error when deviceId is missing
  - Should handle errors gracefully

- **getAllInventory**
  - Should return paginated inventory
  - Should handle errors gracefully

- **getInventoryById**
  - Should return inventory with device details
  - Should return not found when inventory does not exist
  - Should return validation error when inventoryId is missing
  - Should handle errors gracefully

#### Email Service (`email.service.test.ts`)
- **sendNotificationEmail**
  - Should send email successfully
  - Should handle circuit breaker errors
  - Should use retry handler with correct options
  - Should use timeout with correct parameters
  - Should retry on retryable errors
  - Should not retry on non-retryable errors
  - Should get circuit breaker state

#### Email Notification Service (`email-notification.service.test.ts`)
- **getEmailById**
  - Should return email when found
  - Should return not found when email does not exist
  - Should return validation error when emailId is empty
  - Should handle errors gracefully

- **getEmailsByUserId**
  - Should return emails for user
  - Should return emails with isRead filter
  - Should return emails with limit
  - Should return empty array when no emails found
  - Should return validation error when userId is empty
  - Should handle errors gracefully

- **markAsRead**
  - Should mark email as read successfully
  - Should return not found when email does not exist
  - Should return validation error when emailId is empty
  - Should handle errors gracefully

#### Email Notification Controller (`email-notification.controller.test.ts`)
- **getEmailById**
  - Should get email by id successfully
  - Should handle not found error
  - Should handle validation error

- **getEmailsByUserId**
  - Should get emails by user id successfully without filters
  - Should get emails with isRead filter set to true
  - Should get emails with isRead filter set to false
  - Should get emails with limit filter
  - Should get emails with both isRead and limit filters
  - Should handle invalid isRead query parameter
  - Should handle validation error
  - Should handle empty result

- **markAsRead**
  - Should mark email as read successfully
  - Should handle not found error
  - Should handle validation error

#### Repository Tests

##### Device Repository (`device.repository.test.ts`)
- **findById**
  - Should return device DTO when device exists
  - Should return null when device does not exist

- **findAll**
  - Should return paginated devices with default options
  - Should filter by search term
  - Should not filter by empty search term
  - Should apply pagination when page and pageSize are provided

- **availableDevices**
  - Should return paginated devices with inventory information
  - Should filter by search term
  - Should apply pagination
  - Should handle zero available units

##### User Repository (`user.repository.test.ts`)
- **findById**
  - Should return user DTO when user exists
  - Should return null when user does not exist
  - Should include deleted users when includeDeleted is true

- **findByEmailWithPassword**
  - Should return user table when user exists
  - Should return null when user does not exist

- **findAll**
  - Should return paginated users with default options
  - Should filter by role
  - Should filter by isActive
  - Should include deleted users when includeDeleted is true
  - Should filter by firstName
  - Should filter by lastName
  - Should filter by email
  - Should apply pagination when page and pageSize are provided
  - Should handle pagination on first page

##### Reservation Repository (`reservation.repository.test.ts`)
- **createReservation**
  - Should create reservation within transaction and return DTO

- **lockAndGetAvailableInventory**
  - Should lock and return available inventory ID
  - Should return null when no available inventory

- **markInventoryAsUnavailable**
  - Should mark inventory as unavailable

- **findAll**
  - Should return all reservations with details
  - Should apply pagination

- **findByUserId**
  - Should return reservations for specific user

- **findByUserIdWithPagination**
  - Should return paginated reservations for user
  - Should use default pagination when not provided

- **countByUserId**
  - Should return count of reservations for user

- **findByDeviceId**
  - Should return reservations for specific device

- **findById**
  - Should return reservation DTO when exists
  - Should return null when reservation does not exist

- **updateStatus**
  - Should update reservation status and return DTO
  - Should return null when reservation does not exist

- **markInventoryAsAvailable**
  - Should mark inventory as available

##### Waitlist Repository (`waitlist.repository.test.ts`)
- **create**
  - Should create and return waitlist DTO

- **findByUser**
  - Should return array of waitlist DTOs for user

- **findByDevice**
  - Should return array of waitlist DTOs for device

- **remove**
  - Should return true when waitlist entry is removed
  - Should return false when waitlist entry does not exist

- **getPosition**
  - Should return position in waitlist

- **getNextUser**
  - Should return next waitlist entry
  - Should return null when no next user exists

- **markAsNotified**
  - Should mark waitlist entry as notified and return DTO
  - Should return null when waitlist entry does not exist

- **findAllWithDetails**
  - Should return waitlist entries with user and device details
  - Should apply pagination

- **findByUserIdWithDetails**
  - Should return waitlist entries with details for specific user

- **findByDeviceIdWithDetails**
  - Should return waitlist entries with details for specific device

##### Device Inventory Repository (`device-inventory.repository.test.ts`)
- **create**
  - Should create and return inventory DTO
  - Should default isAvailable to true when not provided

- **findById**
  - Should return inventory with device details when exists
  - Should return null when inventory does not exist

- **findByDeviceId**
  - Should return array of inventories with device details

- **findAll**
  - Should return paginated inventories with default options
  - Should filter by deviceId
  - Should filter by serialNumber
  - Should apply pagination

- **update**
  - Should update and return inventory DTO
  - Should return null when inventory does not exist

- **delete**
  - Should return true when inventory is deleted
  - Should return false when inventory does not exist

- **findBySerialNumber**
  - Should return inventory DTO when found
  - Should return null when inventory does not exist
  - Should filter by deviceId when provided

##### Email Notification Repository (`email-notification.repository.test.ts`)
- **create**
  - Should create and return email notification table
  - Should create with failed status and error message

- **findById**
  - Should return email notification table when exists
  - Should return null when email does not exist

- **findByUserId**
  - Should return array of email notifications for user
  - Should filter by isRead when provided
  - Should apply limit when provided
  - Should apply both isRead filter and limit

- **markAsRead**
  - Should mark email as read and return true
  - Should return false when email does not exist

- **markAsReadByUserId**
  - Should mark all unread emails as read for user and return count
  - Should return 0 when no unread emails exist

#### Factory Tests

##### Device Factory (`device.factory.test.ts`)
- **toDto**
  - Should convert DeviceTable to DeviceDto correctly
  - Should handle null description

- **toDtoArray**
  - Should convert array of DeviceTable to array of DeviceDto
  - Should return empty array for empty input

- **toTable**
  - Should convert DeviceDto to DeviceTable correctly
  - Should handle partial DeviceDto
  - Should only include defined fields

- **createDto**
  - Should create DeviceDto from CreateDeviceDto with all fields
  - Should use default values when optional fields are missing
  - Should use provided deviceId and createdAt if provided

##### User Factory (`user.factory.test.ts`)
- **toDto**
  - Should convert UserTable to UserDto correctly
  - Should handle all boolean values correctly

- **toDtoArray**
  - Should convert array of UserTable to array of UserDto
  - Should return empty array for empty input

- **toTable**
  - Should convert UserDto to UserTable correctly
  - Should handle partial UserDto
  - Should handle password field
  - Should only include defined fields

- **createDto**
  - Should create UserDto from CreateUserDto with all fields
  - Should use provided userId and createdAt if provided
  - Should set default values correctly

##### Reservation Factory (`reservation.factory.test.ts`)
- **toDto**
  - Should convert ReservationTable to ReservationDto correctly
  - Should handle different status values

- **toDtoArray**
  - Should convert array of ReservationTable to array of ReservationDto
  - Should return empty array for empty input

- **toTable**
  - Should convert ReservationDto to ReservationTable correctly
  - Should handle partial ReservationDto
  - Should only include defined fields

##### Waitlist Factory (`waitlist.factory.test.ts`)
- **toDto**
  - Should convert WaitlistTable to WaitlistDto correctly
  - Should handle notified waitlist entry
  - Should handle null notifiedAt

- **toDtoArray**
  - Should convert array of WaitlistTable to array of WaitlistDto
  - Should return empty array for empty input

##### Device Inventory Factory (`device-inventory.factory.test.ts`)
- **toDto**
  - Should convert DeviceInventoryTable to DeviceInventoryDto correctly
  - Should handle unavailable inventory

- **toDtoArray**
  - Should convert array of DeviceInventoryTable to array of DeviceInventoryDto
  - Should return empty array for empty input

- **toTable**
  - Should convert DeviceInventoryDto to DeviceInventoryTable correctly
  - Should handle partial DeviceInventoryDto

- **createDto**
  - Should create DeviceInventoryDto from CreateDeviceInventoryDto
  - Should default isAvailable to true when not provided
  - Should use provided inventoryId and createdAt if provided

##### Email Notification Factory (`email-notification.factory.test.ts`)
- **toDto**
  - Should convert EmailNotificationTable to EmailNotificationDto correctly
  - Should handle failed status with error message
  - Should handle pending status

- **toDtoArray**
  - Should convert array of EmailNotificationTable to array of EmailNotificationDto
  - Should return empty array for empty input

#### Controller Tests

##### Waitlist Controller (`waitlist.controller.test.ts`)
- **joinWaitlist**
  - Should join waitlist successfully

- **removeFromWaitlist**
  - Should remove from waitlist successfully

- **getAllWaitlist**
  - Should get all waitlist with default pagination
  - Should handle custom pagination

- **getWaitlistByUserId**
  - Should get waitlist by user ID

- **getWaitlistByDeviceId**
  - Should get waitlist by device ID

- **getMyWaitlist**
  - Should get current user waitlist

##### Device Inventory Controller (`device-inventory.controller.test.ts`)
- **getDeviceInventoryByDeviceId**
  - Should return inventory for device

- **getAllInventory**
  - Should return all inventory with default pagination
  - Should handle custom pagination parameters
  - Should handle deviceId filter
  - Should handle serialNumber filter

- **getInventoryById**
  - Should return inventory by id

#### Middleware Tests

##### Auth Middleware (`auth.middleware.test.ts`)
- **authenticate**
  - Should call next() when token is valid
  - Should return 401 when authorization header is missing
  - Should return 401 when authorization header format is invalid
  - Should return 401 when Bearer prefix is missing
  - Should return 401 when token verification fails
  - Should handle non-Error exceptions
  - Should handle middleware errors

- **requireStaff**
  - Should call next() when user is staff
  - Should return 401 when user is not authenticated
  - Should return 403 when user is not staff

- **requireStudent**
  - Should call next() when user is student
  - Should return 401 when user is not authenticated
  - Should return 403 when user is not student

##### Validation Middleware (`validation.middleware.test.ts`)
- **validate - body source**
  - Should call next() when validation passes
  - Should return 400 when validation fails
  - Should validate strong_password rule
  - Should accept valid strong password

- **validate - query source**
  - Should validate query parameters
  - Should return 400 when query validation fails

- **validate - params source**
  - Should validate route parameters
  - Should return 400 when params validation fails

- **validatePartial**
  - Should call next() when no fields are provided
  - Should validate only provided fields
  - Should return 400 when provided field validation fails
  - Should validate partial query parameters
  - Should validate partial route parameters

- **strong_password validation rule**
  - Should reject passwords shorter than 8 characters
  - Should reject passwords without lowercase letters
  - Should reject passwords without uppercase letters
  - Should reject passwords without numbers
  - Should reject passwords without special characters
  - Should reject non-string values
  - Should accept valid strong passwords

#### Utility Tests

##### Health Routes (`health.routes.test.ts`)
- **GET /health**
  - Should return health status

- **GET /ready**
  - Should return ready status when database is reachable
  - Should return error when database is unreachable

- **GET /metrics**
  - Should return metrics in Prometheus format

##### Rate Limiter (`rate-limiter.test.ts`)
- **Basic rate limiting**
  - Should allow requests within limit
  - Should block requests exceeding limit
  - Should set Retry-After header when limit exceeded
  - Should reset window after expiration

- **Key generation**
  - Should use custom keyGenerator when provided
  - Should use user ID when authenticated
  - Should extract IP from req.ip
  - Should extract IP from X-Forwarded-For header
  - Should extract IP from X-Real-IP header
  - Should extract IP from socket.remoteAddress
  - Should use "unknown" when IP cannot be determined
  - Should include endpoint in key for per-endpoint limiting

- **skipSuccessfulRequests**
  - Should not count successful requests when skipSuccessfulRequests is true
  - Should count failed requests when skipSuccessfulRequests is true

- **skipFailedRequests**
  - Should not count failed requests when skipFailedRequests is true
  - Should count successful requests when skipFailedRequests is true

- **skipSuccessfulRequests and skipFailedRequests together**
  - Should handle both options together

- **cleanup**
  - Should clean up expired entries

- **reset**
  - Should reset rate limit for specific key

- **createRateLimiter**
  - Should create a RateLimiter instance

- **defaultRateLimiter**
  - Should have correct default configuration

- **strictRateLimiter**
  - Should have correct strict configuration

- **Edge cases**
  - Should handle count decrement when count would go below 0
  - Should handle different HTTP methods in endpoint key

##### Timeout (`timeout.test.ts`)
- **withTimeout**
  - Should return result if promise resolves before timeout
  - Should throw TimeoutError if promise exceeds timeout
  - Should use custom error message if provided
  - Should handle promise rejection before timeout

- **TimeoutError**
  - Should create TimeoutError with default message
  - Should create TimeoutError with custom message

##### Retry (`retry.test.ts`)
- **execute - Success scenarios**
  - Should return result on first attempt if successful
  - Should retry and succeed on second attempt

- **execute - Failure scenarios**
  - Should throw error after max attempts
  - Should not retry if error is not retryable

- **execute - Exponential backoff**
  - Should retry multiple times with delays
  - Should respect maxDelay cap

- **execute - Default options**
  - Should use default options when not provided

- **isRetryableDatabaseError**
  - Should return true for retryable error codes
  - Should return true for retryable error messages
  - Should return false for non-retryable errors
  - Should handle case-insensitive message matching

##### Circuit Breaker (`circuit-breaker.test.ts`)
- **Initialization**
  - Should initialize with CLOSED state
  - Should use default options when not provided

- **execute - Success scenarios**
  - Should execute function successfully when circuit is CLOSED
  - Should reset failure count on success

- **execute - Failure scenarios**
  - Should throw error when function fails
  - Should open circuit after reaching failure threshold
  - Should throw error immediately when circuit is OPEN

- **HALF_OPEN state**
  - Should transition to HALF_OPEN after reset timeout
  - Should close circuit after successful recovery in HALF_OPEN
  - Should reopen circuit if failure occurs in HALF_OPEN

- **Monitoring period**
  - Should reset failure count after monitoring period

- **reset**
  - Should reset circuit to CLOSED state

- **getState**
  - Should return current circuit state

### Integration Tests

#### Device Integration (`device.integration.test.ts`)
- **GET /v1/api/devices/get-all-devices**
  - Should return all devices without authentication
  - Should support pagination
  - Should support search parameter
  - Should return empty array when no devices found

- **GET /v1/api/devices/get-device-by-id/:id**
  - Should return device by id
  - Should return 404 when device not found
  - Should return validation error when id is missing

- **GET /v1/api/devices/available-devices**
  - Should return available devices with inventory counts when authenticated as student
  - Should return 401 when not authenticated
  - Should support pagination
  - Should support search parameter
  - Should return empty array when no devices available

#### User Integration (`user.integration.test.ts`)
- **POST /v1/api/users/login**
  - Should login successfully with valid credentials
  - Should return error with invalid email
  - Should return error with invalid password
  - Should return validation error when email is missing

- **GET /v1/api/users/get-all-users**
  - Should return users when authenticated as staff
  - Should return 401 when not authenticated
  - Should support pagination

- **GET /v1/api/users/me**
  - Should return current user profile for student
  - Should return current user profile for staff
  - Should return 401 when not authenticated
  - Should return 404 when user not found
  - Should return 404 when user is deleted
  - Should return 404 when user is inactive
  - Should return 401 when token is invalid

#### Reservation Integration (`reservation.integration.test.ts`)
- **POST /v1/api/reservations/:deviceId/reserve**
  - Should create reservation successfully
  - Should return 401 when not authenticated
  - Should return 409 when no inventory available

- **PATCH /v1/api/reservations/:reservationId/cancel**
  - Should cancel reservation successfully
  - Should return 401 when not authenticated

- **GET /v1/api/reservations/me**
  - Should get my reservations with pagination successfully
  - Should use default pagination when query params not provided
  - Should handle custom pagination parameters
  - Should return 401 when not authenticated
  - Should return empty array when no reservations exist
  - Should handle database errors gracefully

#### Waitlist Integration (`waitlist.integration.test.ts`)
- **POST /v1/api/waitlist/:deviceId/join**
  - Should join waitlist successfully
  - Should return error when already on waitlist
  - Should return 401 when not authenticated

- **DELETE /v1/api/waitlist/:deviceId/remove**
  - Should remove from waitlist successfully
  - Should return 404 when not on waitlist
  - Should return 401 when not authenticated

---

## Loan Service (Backend)

### Unit Tests

#### Loan Service (`loan.service.test.ts`)
- **collect**
  - Should collect loan successfully
  - Should return error when reservation not found
  - Should return validation error when reservation status is not pending
  - Should return error when loan creation fails
  - Should handle non-Error objects thrown during collection

- **returnLoan**
  - Should return loan successfully
  - Should return error when loan not found
  - Should continue even if waitlist notification fails
  - Should return error when database operation fails
  - Should handle non-Error objects thrown during return

- **getAllLoans**
  - Should get all loans with pagination successfully
  - Should use default pagination when options not provided
  - Should calculate pagination metadata correctly
  - Should return error when database query fails
  - Should handle non-Error objects thrown during getAllLoans

- **getLoansByUserId**
  - Should get loans by user ID with pagination successfully
  - Should use default pagination when options not provided
  - Should calculate pagination metadata correctly
  - Should return validation error when userId is empty
  - Should handle errors gracefully
  - Should handle non-Error objects thrown during getLoansByUserId

#### Auth Middleware (`auth.middleware.test.ts`)
- **authenticate**
  - Should authenticate successfully with valid Bearer token
  - Should return 401 when authorization header is missing
  - Should return 401 when authorization header format is invalid - missing Bearer
  - Should return 401 when authorization header format is invalid - wrong number of parts
  - Should return 401 when token verification fails
  - Should return 401 when token verification throws non-Error
  - Should handle unexpected errors in middleware

- **requireStaff**
  - Should allow access when user has staff role
  - Should return 401 when user is not authenticated
  - Should return 403 when user does not have staff role

- **requireStudent**
  - Should allow access when user has student role
  - Should return 401 when user is not authenticated
  - Should return 403 when user does not have student role

#### Health Routes (`health.routes.test.ts`)
- **GET /health**
  - Should return health status

- **GET /ready**
  - Should return ready status when database is reachable
  - Should return error when database is unreachable

- **GET /metrics**
  - Should return metrics in Prometheus format

#### Rate Limiter (`rate-limiter.test.ts`)
- **RateLimiter middleware**
  - Should allow request when under limit
  - Should block request when limit exceeded
  - Should reset window after expiration
  - Should use custom key generator when provided
  - Should use user ID when authenticated
  - Should use IP address when not authenticated
  - Should use x-forwarded-for header when available
  - Should use x-real-ip header when available
  - Should use socket.remoteAddress when available
  - Should use "unknown" when no IP source available
  - Should skip successful requests when option is enabled
  - Should skip failed requests when option is enabled
  - Should decrement count when skipping successful requests
  - Should handle response send override correctly
  - Should handle case when record is deleted before send is called
  - Should handle skipFailedRequests when record is missing

- **cleanup**
  - Should remove expired entries
  - Should not remove entries that are not expired

- **reset**
  - Should reset rate limit for a specific key

- **createRateLimiter**
  - Should create a RateLimiter instance

- **defaultRateLimiter**
  - Should be configured with default settings

- **strictRateLimiter**
  - Should be configured with strict settings

#### Response DTO (`response.dto.test.ts`)
- **ResponseHelper.success**
  - Should return success response with default message
  - Should return success response with custom message
  - Should handle null data

- **ResponseHelper.notFound**
  - Should return not found response with default message
  - Should return not found response with custom message

- **ResponseHelper.validationError**
  - Should return validation error response with default message
  - Should return validation error response with custom message

- **ResponseHelper.error**
  - Should return error response with default message
  - Should return error response with custom message

#### Correlation ID (`correlation-id.test.ts`)
- **correlationIdMiddleware**
  - Should use existing correlation ID from header
  - Should generate new correlation ID when header is missing
  - Should generate UUID format correlation ID

- **getCorrelationId**
  - Should return correlation ID when present
  - Should return undefined when correlation ID is not present

#### Controller Utils (`controller.utils.test.ts`)
- **getValidationErrors**
  - Should return empty string when there are no errors
  - Should return comma-separated error messages
  - Should handle single error

- **getStatusCode**
  - Should return default success status code (200)
  - Should return custom default success status code
  - Should return 404 for code 05 (not found)
  - Should return 400 for code 09 (validation error)
  - Should return 500 for other error codes

### Integration Tests

#### Loan Integration (`loan.integration.test.ts`)
- **PATCH /v1/api/loans/:reservationId/collect**
  - Should collect loan successfully
  - Should return 401 when not authenticated
  - Should return 403 when user is not staff
  - Should return 404 when reservation not found
  - Should return 400 when reservation status is not pending
  - Should return 400 when loan already exists for reservation

- **PATCH /v1/api/loans/:loanId/return**
  - Should return loan successfully
  - Should return 401 when not authenticated
  - Should return 403 when user is not staff
  - Should return 404 when loan not found
  - Should succeed even if waitlist notification fails

- **GET /v1/api/loans/get-all-loans**
  - Should get all loans with pagination successfully
  - Should use default pagination when query params not provided
  - Should handle custom pagination parameters
  - Should return 401 when not authenticated
  - Should return 403 when user is not staff
  - Should return empty array when no loans exist
  - Should handle database errors gracefully

- **GET /v1/api/loans/user/:userId**
  - Should get loans by user ID with pagination successfully
  - Should use default pagination when query params not provided
  - Should handle custom pagination parameters
  - Should return 401 when not authenticated
  - Should return 403 when user is not staff
  - Should return empty array when no loans exist for user
  - Should handle database errors gracefully

---

## Frontend

### Component Tests

#### Navbar (`Navbar.test.tsx`)
- Should render login link when not authenticated
- Should render user info and logout button when authenticated as student
- Should render user info and logout button when authenticated as staff
- Should call logout and navigate to login when logout button is clicked
- Should show available devices link when authenticated
- Should not show dashboard links when not authenticated

#### ProtectedRoute (`ProtectedRoute.test.tsx`)
- Should render children when authenticated and no role requirement
- Should redirect to login when not authenticated
- Should redirect to dashboard when staff required but user is student
- Should redirect to staff when student required but user is staff
- Should render children when staff required and user is staff
- Should render children when student required and user is student
- Should show loading spinner when isLoading is true

### Context Tests

#### AuthContext (`AuthContext.test.tsx`)
- **useAuth hook**
  - Should throw error when used outside AuthProvider
  - Should return initial state when no token exists
  - Should fetch user when token exists
  - Should clear token when getCurrentUser fails
  - Should clear token when getCurrentUser returns unsuccessful response

- **login**
  - Should login successfully and set token
  - Should throw error when login fails

- **logout**
  - Should clear user and token on logout

- **role detection**
  - Should detect staff role correctly
  - Should detect student role correctly

### API Client Tests

#### Device Service (`device-service.test.ts`)
- **login**
  - Should call login endpoint with email and password

- **getCurrentUser**
  - Should call get current user endpoint

- **getAllUsers**
  - Should call get all users endpoint with params
  - Should call get all users endpoint without params

- **getAllDevices**
  - Should call get all devices endpoint with params

- **getAvailableDevices**
  - Should call get available devices endpoint

- **reserveDevice**
  - Should call reserve device endpoint

- **cancelReservation**
  - Should call cancel reservation endpoint

- **joinWaitlist**
  - Should call join waitlist endpoint

- **getUserById**
  - Should call get user by id endpoint

- **getDeviceById**
  - Should call get device by id endpoint

- **getInventoryByDeviceId**
  - Should call get inventory by device id endpoint

- **getAllInventory**
  - Should call get all inventory endpoint with params
  - Should call get all inventory endpoint without params

- **getMyReservations**
  - Should call get my reservations endpoint with params
  - Should call get my reservations endpoint without params

- **getAllReservations**
  - Should call get all reservations endpoint with params
  - Should call get all reservations endpoint without params

- **getReservationsByUserId**
  - Should call get reservations by user id endpoint

- **removeFromWaitlist**
  - Should call remove from waitlist endpoint

- **getMyWaitlist**
  - Should call get my waitlist endpoint

- **getAllWaitlist**
  - Should call get all waitlist endpoint with params
  - Should call get all waitlist endpoint without params

- **getWaitlistByUserId**
  - Should call get waitlist by user id endpoint

- **request interceptor**
  - Should add Authorization header when token exists
  - Should not add Authorization header when token does not exist

- **environment variable configuration**
  - Should use NEXT_PUBLIC_DEVICE_SERVICE_URL when set
  - Should use default URL when NEXT_PUBLIC_DEVICE_SERVICE_URL is not set

#### Loan Service (`loan-service.test.ts`)
- **collectLoan**
  - Should call collect loan endpoint

- **returnLoan**
  - Should call return loan endpoint

- **getAllLoans**
  - Should call get all loans endpoint with params
  - Should call get all loans endpoint without params

- **getLoansByUserId**
  - Should call get loans by user id endpoint with params
  - Should call get loans by user id endpoint without params

- **request interceptor**
  - Should add Authorization header when token exists
  - Should not add Authorization header when token does not exist

- **environment variable configuration**
  - Should use NEXT_PUBLIC_LOAN_SERVICE_URL when set
  - Should use default URL when NEXT_PUBLIC_LOAN_SERVICE_URL is not set

### Utility Tests

#### Utils (`utils.test.ts`)
- **formatDate**
  - Should format a date string
  - Should format a Date object

- **formatDateShort**
  - Should format a date string in short format
  - Should format a Date object in short format

- **formatRelativeTime**
  - Should format relative time from a date string
  - Should format relative time from a Date object

- **getErrorMessage**
  - Should extract message from axios error response
  - Should extract message from error object
  - Should return default message when no message found
  - Should return default message for null/undefined
  - Should prioritize response.data.message over error.message

---

## Summary

### Test Coverage by Service

- **Device Service**: 200+ unit tests, 12 integration tests
- **Loan Service**: 25+ unit tests, 12 integration tests
- **Frontend**: 20+ component/context tests, 30+ API client tests, 5 utility tests

### Test Categories

1. **Unit Tests**: Testing individual functions, services, repositories, factories, controllers, and utilities in isolation
2. **Integration Tests**: Testing API endpoints with mocked dependencies
3. **Component Tests**: Testing React components with mocked dependencies
4. **Context Tests**: Testing React context providers and hooks
5. **API Client Tests**: Testing API client functions and interceptors

### Key Testing Areas

- **Business Logic**: Services, repositories, factories
- **API Endpoints**: Controllers and routes
- **Authentication & Authorization**: Middleware and protected routes
- **Data Validation**: Validation middleware and input validation
- **Error Handling**: Error responses and error codes
- **Concurrency**: Reservation concurrency handling
- **Resilience**: Circuit breaker, retry, timeout mechanisms
- **Rate Limiting**: Rate limiter with various configurations
- **UI Components**: React components and context providers
- **API Integration**: Frontend API clients

