/**
 * Re-export error types and utilities from the centralized error types module
 */

export {
  // Types
  type AppError,
  type ErrorCode,
  type ErrorDetails,
  type Result,
  type SuccessResult,
  type ErrorResult,
  type ValidationError,
  type DatabaseError,
  type NotFoundError,
  type ApiError,
  type ServiceError,
  type PaymentError,
  
  // Functions
  createSuccessResult,
  createErrorResult,
  createValidationError,
  createNotFoundError,
  createDatabaseError,
  createApiError,
  createServiceError,
  createPaymentError,
  createAuthError,
  createForbiddenError,
  createNetworkError,
  createTimeoutError,
  
  // Type guards
  isAppError,
  isErrorResult,
  isErrorResponse,
  isSuccessResponse
} from '@/types/error.types'; 