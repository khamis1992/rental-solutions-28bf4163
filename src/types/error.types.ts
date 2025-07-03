import { Result, SuccessResult, ErrorResult } from './response.types';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Error codes for different types of errors
 */
export type ErrorCode = 
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'DATABASE_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'API_ERROR'
  | 'SERVICE_ERROR'
  | 'PAYMENT_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Error context for additional error information
 */
export interface ErrorContext {
  source?: string;
  operation?: string;
  userId?: string;
  requestId?: string;
  timestamp?: string;
  environment?: string;
  component?: string;
  method?: string;
  params?: Record<string, unknown>;
  response?: unknown;
}

/**
 * Standard error details interface
 */
export interface ErrorDetails {
  field?: string;
  message?: string;
  query?: string;
  params?: Record<string, unknown>;
  constraint?: string;
  endpoint?: string;
  method?: string;
  status?: number;
  service?: string;
  operation?: string;
  paymentId?: string;
  amount?: number;
  reason?: string;
  resource?: string;
  id?: string | number;
  validationErrors?: Array<{
    field: string;
    message: string;
  }>;
  [key: string]: unknown;
}

/**
 * Error patterns for handling
 */
export type ErrorPattern = 'SILENT' | 'TOAST_ONLY' | 'CONSOLE_ONLY' | 'FULL';

/**
 * Base error interface for all application errors
 */
export interface AppError {
  code: string;
  message: string;
  severity?: ErrorSeverity;
  retryable?: boolean;
  context?: Record<string, any>;
  details?: Record<string, any>;
}

/**
 * Error handling configuration
 */
export interface ErrorConfig {
  pattern?: ErrorPattern;
  context?: Record<string, any>;
  customMessage?: string;
  severity?: ErrorSeverity;
  showToast?: boolean;
  logError?: boolean;
}

/**
 * Error state for hooks
 */
export interface ErrorState {
  error: AppError | null;
  isError: boolean;
  hasError: boolean;
  errorMessage: string | null;
  severity: ErrorSeverity;
}

/**
 * Form error state
 */
export interface FormErrorState {
  fieldErrors: Record<string, string[]>;
  generalError: AppError | null;
  isError: boolean;
  hasFieldErrors: boolean;
  hasGeneralError: boolean;
}

/**
 * Creates a standardized error result
 */
export function createErrorResult<T>(error: AppError): ErrorResult<T> {
  return {
    success: false,
    error,
    data: null
  };
}

/**
 * Creates a standardized success result
 */
export function createSuccessResult<T>(data: T): SuccessResult<T> {
  return {
    success: true,
    data,
    error: null
  };
}

/**
 * Creates a database error
 */
export function createDatabaseError(
  message: string,
  details: ErrorDetails
): AppError {
  return {
    code: 'DATABASE_ERROR',
    message,
    details,
    severity: 'high',
    retryable: true
  };
}

/**
 * Type guard to check if a value is an AppError
 */
export function isAppError(value: unknown): value is AppError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value
  );
}

/**
 * Type guard to check if a result is a success result
 */
export function isSuccessResult<T>(result: Result<T>): result is SuccessResult<T> {
  return result.success === true;
}

/**
 * Type guard to check if a result is an error result
 */
export function isErrorResult<T>(result: Result<T>): result is ErrorResult<T> {
  return result.success === false;
}

/**
 * Creates a validation error
 */
export function createValidationError(
  message: string,
  details: ErrorDetails
): AppError {
  return {
    code: 'VALIDATION_ERROR',
    message,
    details,
    severity: 'medium',
    retryable: false
  };
}

/**
 * Creates an authentication error
 */
export function createAuthenticationError(
  message: string,
  details?: ErrorDetails
): AppError {
  return {
    code: 'AUTHENTICATION_ERROR',
    message,
    details,
    severity: 'high',
    retryable: false
  };
}

/**
 * Creates an authorization error
 */
export function createAuthorizationError(
  message: string,
  details?: ErrorDetails
): AppError {
  return {
    code: 'AUTHORIZATION_ERROR',
    message,
    details,
    severity: 'high',
    retryable: false
  };
}

/**
 * Creates a not found error
 */
export function createNotFoundError(
  message: string,
  details?: ErrorDetails
): AppError {
  return {
    code: 'NOT_FOUND_ERROR',
    message,
    details,
    severity: 'medium',
    retryable: false
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
    details,
    severity: 'high',
    retryable: true
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
    code: 'TIMEOUT_ERROR',
    message,
    details,
    severity: 'medium',
    retryable: true
  };
}

/**
 * Creates a rate limit error
 */
export function createRateLimitError(
  message: string,
  details?: ErrorDetails
): AppError {
  return {
    code: 'RATE_LIMIT_ERROR',
    message,
    details,
    severity: 'medium',
    retryable: true
  };
}

/**
 * Creates an API error
 */
export function createApiError(
  message: string,
  details?: ErrorDetails
): AppError {
  return {
    code: 'API_ERROR',
    message,
    details,
    severity: 'high',
    retryable: true
  };
}

/**
 * Creates a service error
 */
export function createServiceError(
  message: string,
  details?: ErrorDetails
): AppError {
  return {
    code: 'SERVICE_ERROR',
    message,
    details,
    severity: 'high',
    retryable: true
  };
}

/**
 * Creates a payment error
 */
export function createPaymentError(
  message: string,
  details?: ErrorDetails
): AppError {
  return {
    code: 'PAYMENT_ERROR',
    message,
    details,
    severity: 'high',
    retryable: false
  };
}

/**
 * Creates an unknown error
 */
export function createUnknownError(
  message: string,
  details?: ErrorDetails
): AppError {
  return {
    code: 'UNKNOWN_ERROR',
    message,
    details,
    severity: 'high',
    retryable: false
  };
} 