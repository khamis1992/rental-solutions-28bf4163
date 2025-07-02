/**
 * Re-export error types and utilities from the centralized error types module
 */

export {
  // Types
  type AppError,
  type ErrorCode,
  type ErrorDetails,
  type ErrorSeverity,
  type // ErrorContext - removed unused variable// Functions
  createErrorResult,
  createSuccessResult,
  createDatabaseError,
  createValidationError,
  createAuthenticationError,
  createAuthorizationError,
  createNotFoundError,
  createNetworkError,
  createTimeoutError,
  createRateLimitError,
  createApiError,
  createServiceError,
  createPaymentError,
  // createUnknownError - removed unused variable// Type guards
  isAppError,
  isSuccessResult,
  isErrorResult
} from '@/types/error.types'; 