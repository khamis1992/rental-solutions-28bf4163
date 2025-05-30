import { PostgrestError } from '@supabase/supabase-js';
import { 
  Result, 
  ServiceError, 
  createServiceError, 
  createSuccessResult, 
  createErrorResult,
  createDatabaseError,
  createNotFoundError,
  AppError
} from '@/types/error.types';
import { errorLogger } from '@/lib/errors/error-logger';
import { toAppError } from '@/lib/errors/error-handler';

export class BaseService {
  constructor(private supabaseClient: any) {}

  protected success<T>(data: T): Result<T> {
    return createSuccessResult(data);
  }

  protected error<T>(error: unknown, message?: string): Result<T> {
    const appError = toAppError(error);
    if (message) {
      appError.message = `${message}: ${appError.message}`;
    }
    
    errorLogger.logError(error, 'error', {
      source: this.constructor.name,
      details: { message: appError.message }
    });
    
    return createErrorResult(appError);
  }

  protected handleError(error: unknown, defaultMessage: string = 'An error occurred'): Result<never> {
    // Log the error with context
    errorLogger.logError(error, 'error', {
      source: this.constructor.name,
      operation: 'handleError',
      details: { defaultMessage }
    });

    // Handle different error types for better error messages
    if (isPostgrestError(error)) {
      // Handle specific postgres/supabase error codes
      if (error.code === '42P01') {
        return createErrorResult(createDatabaseError('Database table not found', {
          query: 'unknown',
          params: null
        }));
      } else if (error.code === '42703') {
        // Column does not exist error
        return createErrorResult(createDatabaseError(`Database column not found: ${error.details || error.message}`, {
          query: 'unknown',
          params: null
        }));
      } else if (error.code === '23505') {
        return createErrorResult(createDatabaseError('Duplicate record found', {
          query: 'unknown',
          params: null
        }));
      } else {
        return createErrorResult(createDatabaseError(`Database error: ${error.message}`, {
          query: 'unknown',
          params: null
        }));
      }
    } 
    
    // Handle generic error 
    else if (error instanceof Error) {
      return createErrorResult({
        code: 'UNKNOWN_ERROR',
        message: error.message,
        details: { stack: error.stack },
        originalError: error
      });
    } 
    
    // Handle string errors
    else if (typeof error === 'string') {
      return createErrorResult({
        code: 'UNKNOWN_ERROR',
        message: error
      });
    }
    
    // Handle unknown errors
    return createErrorResult({
      code: 'UNKNOWN_ERROR',
      message: defaultMessage,
      originalError: error
    });
  }
  
  protected async safeExecute<T>(
    operation: () => Promise<T>,
    errorMessage: string = 'Operation failed'
  ): Promise<Result<T>> {
    try {
      const result = await operation();
      return this.success(result);
    } catch (error) {
      errorLogger.logError(error, 'error', {
        source: this.constructor.name,
        operation: 'safeExecute',
        details: { errorMessage }
      });
      return this.handleError(error, errorMessage);
    }
  }

  protected createServiceError(
    message: string,
    operation: string
  ): ServiceError {
    return createServiceError(
      message,
      this.constructor.name,
      operation
    );
  }
}

/**
 * Type guard for PostgrestError
 */
function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'details' in error &&
    'hint' in error &&
    'code' in error
  );
}
