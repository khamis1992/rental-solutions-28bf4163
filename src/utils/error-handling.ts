
/**
 * Type-safe error handling utilities
 */

// Define a base error interface
export interface BaseError {
  message: string;
  code?: string | number;
  stack?: string;
}

// Specific error types
export interface ApiError extends BaseError {
  statusCode: number;
  endpoint?: string;
  responseBody?: unknown;
}

export interface DatabaseError extends BaseError {
  table?: string;
  operation?: 'insert' | 'select' | 'update' | 'delete' | 'unknown';
  details?: unknown;
}

export interface ValidationError extends BaseError {
  field?: string;
  value?: unknown;
  constraints?: Record<string, string>;
}

// Type guards
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' && 
    error !== null && 
    'statusCode' in error && 
    'message' in error
  );
}

export function isDatabaseError(error: unknown): error is DatabaseError {
  return (
    typeof error === 'object' && 
    error !== null && 
    'message' in error && 
    ('table' in error || 'operation' in error)
  );
}

export function isValidationError(error: unknown): error is ValidationError {
  return (
    typeof error === 'object' && 
    error !== null && 
    'message' in error && 
    ('field' in error || 'constraints' in error)
  );
}

// Safe error message extraction
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  } 
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return (error as { message: string }).message;
  }
  
  return 'An unknown error occurred';
}

// Type-safe error handling for async functions
export async function safeAsync<T>(
  promise: Promise<T>, 
  errorHandler?: (error: unknown) => void
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    if (errorHandler) {
      errorHandler(error);
    }
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error(getErrorMessage(error)) 
    };
  }
}
