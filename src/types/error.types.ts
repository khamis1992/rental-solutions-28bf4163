/**
 * Standard error codes used across the application
 */
export type ErrorCode = 
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'AUTH_ERROR'
  | 'FORBIDDEN'
  | 'DATABASE_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'API_ERROR'
  | 'SERVICE_ERROR'
  | 'PAYMENT_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Standard error details interface
 */
export interface ErrorDetails {
  [key: string]: any;
}

/**
 * Base error interface for all application errors
 */
export interface AppError {
  code: ErrorCode;
  message: string;
  details?: ErrorDetails;
  originalError?: unknown;
  status?: number;
}

/**
 * Validation error type
 */
export interface ValidationError extends AppError {
  code: 'VALIDATION_ERROR';
  details: {
    field: string;
    message: string;
  }[];
}

/**
 * Database error type
 */
export interface DatabaseError extends AppError {
  code: 'DATABASE_ERROR';
  details: {
    query?: string;
    params?: unknown;
    constraint?: string;
  };
}

/**
 * Not found error type
 */
export interface NotFoundError extends AppError {
  code: 'NOT_FOUND';
  details: {
    resource: string;
    id?: string | number;
  };
}

/**
 * API error type
 */
export interface ApiError extends AppError {
  code: 'API_ERROR';
  details: {
    endpoint?: string;
    method?: string;
    status?: number;
  };
}

/**
 * Service error type
 */
export interface ServiceError extends AppError {
  code: 'SERVICE_ERROR';
  details: {
    service: string;
    operation: string;
  };
}

/**
 * Payment error type
 */
export interface PaymentError extends AppError {
  code: 'PAYMENT_ERROR';
  details: {
    paymentId?: string;
    amount?: number;
    reason?: string;
  };
}

/**
 * Standard API response interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error?: AppError;
  message?: string;
}

/**
 * Result type for operations that can succeed or fail
 */
export type Result<T> = SuccessResult<T> | ErrorResult<T>;

export interface SuccessResult<T> {
  success: true;
  data: T;
  error: null;
}

export interface ErrorResult<T> {
  success: false;
  error: AppError;
  data: null;
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse<T = any>(
  error: AppError | string,
  data: T | null = null
): ApiResponse<T> {
  const appError: AppError = typeof error === 'string' 
    ? { 
        code: 'UNKNOWN_ERROR',
        message: error
      }
    : error;

  return {
    success: false,
    data,
    error: appError,
    message: appError.message
  };
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string
): ApiResponse<T> {
  return {
    success: true,
    data,
    message
  };
}

/**
 * Creates a success result
 */
export function createSuccessResult<T>(data: T): SuccessResult<T> {
  return {
    success: true,
    data,
    error: null
  };
}

/**
 * Creates an error result
 */
export function createErrorResult<T>(error: AppError): ErrorResult<T> {
  return {
    success: false,
    error,
    data: null
  };
}

/**
 * Type guard to check if a value is an error response
 */
export function isErrorResponse(value: unknown): value is ApiResponse<never> {
  if (!value || typeof value !== 'object') return false;
  
  const response = value as ApiResponse<unknown>;
  return (
    response.success === false &&
    'error' in response &&
    (
      typeof response.error === 'string' ||
      (typeof response.error === 'object' && response.error !== null && 'code' in response.error)
    )
  );
}

/**
 * Type guard to check if a value is a success response
 */
export function isSuccessResponse<T>(value: unknown): value is ApiResponse<T> {
  if (!value || typeof value !== 'object') return false;
  
  const response = value as ApiResponse<unknown>;
  return response.success === true && 'data' in response;
}

/**
 * Type guard to check if a value is an AppError
 */
export function isAppError(value: unknown): value is AppError {
  if (!value || typeof value !== 'object') return false;
  
  const error = value as AppError;
  return (
    'code' in error &&
    'message' in error &&
    typeof error.code === 'string' &&
    typeof error.message === 'string'
  );
}

/**
 * Type guard to check if a result is an error result
 */
export function isErrorResult<T>(result: Result<T>): result is ErrorResult<T> {
  return !result.success;
}

/**
 * Creates a validation error
 */
export function createValidationError(
  message: string,
  details: ValidationError['details']
): ValidationError {
  return {
    code: 'VALIDATION_ERROR',
    message,
    details
  };
}

/**
 * Creates a not found error
 */
export function createNotFoundError(
  resource: string,
  id?: string | number
): NotFoundError {
  return {
    code: 'NOT_FOUND',
    message: `${resource}${id ? ` with ID ${id}` : ''} not found`,
    details: { resource, id }
  };
}

/**
 * Creates a database error
 */
export function createDatabaseError(
  message: string,
  details: DatabaseError['details']
): DatabaseError {
  return {
    code: 'DATABASE_ERROR',
    message,
    details
  };
}

/**
 * Creates an API error
 */
export function createApiError(
  message: string,
  details: ApiError['details']
): ApiError {
  return {
    code: 'API_ERROR',
    message,
    details
  };
}

/**
 * Creates a service error
 */
export function createServiceError(
  message: string,
  service: string,
  operation: string
): ServiceError {
  return {
    code: 'SERVICE_ERROR',
    message,
    details: { service, operation }
  };
}

/**
 * Creates a payment error
 */
export function createPaymentError(
  message: string,
  details: PaymentError['details']
): PaymentError {
  return {
    code: 'PAYMENT_ERROR',
    message,
    details
  };
}

/**
 * Creates an authentication error
 */
export function createAuthError(
  message: string,
  details?: ErrorDetails
): AppError {
  return {
    code: 'AUTH_ERROR',
    message,
    details
  };
}

/**
 * Creates a forbidden error
 */
export function createForbiddenError(
  message: string,
  details?: ErrorDetails
): AppError {
  return {
    code: 'FORBIDDEN',
    message,
    details
  };
}

/**
 * Creates a network error
 */
export function createNetworkError(
  message: string,
  details?: ErrorDetails
): AppError {
  return {
    code: 'NETWORK_ERROR',
    message,
    details
  };
}

/**
 * Creates a timeout error
 */
export function createTimeoutError(
  message: string,
  details?: ErrorDetails
): AppError {
  return {
    code: 'TIMEOUT',
    message,
    details
  };
} 