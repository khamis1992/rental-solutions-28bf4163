
import { 
  ApiError, 
  DatabaseError,
  ValidationError,
  BaseError,
  isApiError,
  isDatabaseError,
  isValidationError,
  getErrorMessage
} from '@/utils/error-handling';

/**
 * Create a discriminated union of error types
 */
export type ErrorResult = 
  | { type: 'api'; error: ApiError }
  | { type: 'database'; error: DatabaseError }
  | { type: 'validation'; error: ValidationError }
  | { type: 'unknown'; error: BaseError | Error };

/**
 * Convert any error to a typed ErrorResult for precise handling
 */
export function categorizeError(error: unknown): ErrorResult {
  if (isApiError(error)) {
    return { type: 'api', error };
  }
  
  if (isDatabaseError(error)) {
    return { type: 'database', error };
  }
  
  if (isValidationError(error)) {
    return { type: 'validation', error };
  }
  
  // Create a BaseError from unknown error types
  const baseError: BaseError = {
    message: getErrorMessage(error),
    code: error instanceof Error && 'code' in error 
      ? (error as any).code 
      : 'UNKNOWN_ERROR'
  };
  
  return { type: 'unknown', error: baseError };
}

/**
 * Handle errors with specific handlers for each type
 */
export function handleTypedError<T>(
  error: unknown,
  handlers: {
    onApiError?: (error: ApiError) => T;
    onDatabaseError?: (error: DatabaseError) => T;
    onValidationError?: (error: ValidationError) => T;
    onUnknownError?: (error: BaseError | Error) => T;
    fallback: () => T;
  }
): T {
  const result = categorizeError(error);
  
  switch (result.type) {
    case 'api':
      return handlers.onApiError ? handlers.onApiError(result.error) : handlers.fallback();
    case 'database':
      return handlers.onDatabaseError ? handlers.onDatabaseError(result.error) : handlers.fallback();
    case 'validation':
      return handlers.onValidationError ? handlers.onValidationError(result.error) : handlers.fallback();
    case 'unknown':
      return handlers.onUnknownError ? handlers.onUnknownError(result.error) : handlers.fallback();
    default:
      return handlers.fallback();
  }
}

/**
 * Format error message with context based on error type
 */
export function formatTypedErrorMessage(error: unknown): string {
  const result = categorizeError(error);
  
  switch (result.type) {
    case 'api':
      return `API Error (${result.error.statusCode || 'unknown'}): ${result.error.message}`;
    case 'database':
      return `Database Error (${result.error.operation || 'unknown'} on ${result.error.table || 'unknown'}): ${result.error.message}`;
    case 'validation':
      return `Validation Error${result.error.field ? ` in ${result.error.field}` : ''}: ${result.error.message}`;
    case 'unknown':
      return `Error: ${result.error.message}`;
  }
}

/**
 * Type-safe error handling with discriminated unions
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorHandlers?: {
    onApiError?: (error: ApiError) => T | Promise<T>;
    onDatabaseError?: (error: DatabaseError) => T | Promise<T>;
    onValidationError?: (error: ValidationError) => T | Promise<T>;
    onUnknownError?: (error: BaseError | Error) => T | Promise<T>;
  },
  defaultValue?: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const result = categorizeError(error);
    
    switch (result.type) {
      case 'api':
        if (errorHandlers?.onApiError) {
          return await errorHandlers.onApiError(result.error);
        }
        break;
      case 'database':
        if (errorHandlers?.onDatabaseError) {
          return await errorHandlers.onDatabaseError(result.error);
        }
        break;
      case 'validation':
        if (errorHandlers?.onValidationError) {
          return await errorHandlers.onValidationError(result.error);
        }
        break;
      case 'unknown':
        if (errorHandlers?.onUnknownError) {
          return await errorHandlers.onUnknownError(result.error);
        }
        break;
    }
    
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    
    throw error; // Re-throw if no handler matched and no default value
  }
}
