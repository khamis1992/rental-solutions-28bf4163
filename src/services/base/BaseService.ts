import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { 
  Result, 
  ServiceError, 
  createServiceError, 
  createSuccessResult, 
  createErrorResult,
  createDatabaseError,
  createNotFoundError,
  AppError,
  ErrorContext,
  ErrorSeverity
} from '@/types/error.types';
import { errorLogger } from '@/lib/errors/error-logger';
import { toAppError } from '@/types/service.types';
import {
  toDatabaseError,
  isSchemaError,
  isPostgrestError,
  getErrorContext
} from '@/lib/errors/database-error-handler';

export class BaseService {
  constructor(private supabaseClient: SupabaseClient) {}

  protected success<T>(data: T): Result<T> {
    return createSuccessResult(data);
  }

  protected error<T>(error: unknown, message?: string): Result<T> {
    const appError = toAppError(error);
    if (message) {
      appError.message = `${message}: ${appError.message}`;
    }
    
    errorLogger.logError(error, 'high', {
      source: this.constructor.name,
      details: { message: appError.message }
    });
    
    return createErrorResult(appError);
  }

  protected handleError(error: unknown, defaultMessage: string = 'An error occurred'): Result<never> {
    // Create error context
    const context: ErrorContext = {
      source: this.constructor.name,
      operation: 'handleError',
      timestamp: new Date().toISOString()
    };

    // Log the error with context
    errorLogger.logError(error, 'medium', {
      ...context,
      details: { defaultMessage }
    });

    // Handle different error types for better error messages
    if (isPostgrestError(error)) {
      // Get database-specific context
      const dbContext = getErrorContext(error, context);
      
      // Handle schema errors
      if (isSchemaError(error)) {
        return createErrorResult(toDatabaseError(error, {
          ...dbContext,
          query: 'schema_operation'
        }));
      }
      
      // Handle all other database errors
      return createErrorResult(toDatabaseError(error, dbContext));
    } 
    
    // Handle generic error 
    if (error instanceof Error) {
      return createErrorResult(toAppError(error, context));
    } 
    
    // Handle string errors
    if (typeof error === 'string') {
      return createErrorResult(toAppError(error, context));
    }
    
    // Handle unknown errors
    return createErrorResult(toAppError(defaultMessage, context));
  }
  
  protected async safeExecute<T>(
    operation: () => Promise<T>,
    errorMessage: string = 'Operation failed'
  ): Promise<Result<T>> {
    try {
      const result = await operation();
      return this.success(result);
    } catch (error) {
      errorLogger.logError(error, 'high', {
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
    return createServiceError(message, {
      service: this.constructor.name,
      operation
    });
  }
}
