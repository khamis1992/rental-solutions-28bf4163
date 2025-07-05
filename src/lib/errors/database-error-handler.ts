import { PostgrestError } from '@supabase/supabase-js';
import { 
  DatabaseError,
  createDatabaseError,
  ErrorContext,
  ErrorDetails
} from '@/types/error.types';

/**
 * PostgreSQL error codes and their meanings
 */
export const POSTGRES_ERROR_CODES = {
  // Data integrity errors
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  
  // Table/Column errors
  UNDEFINED_TABLE: '42P01',
  UNDEFINED_COLUMN: '42703',
  
  // Authentication errors
  INVALID_PASSWORD: '28P01',
  INVALID_AUTHORIZATION: '28000',
  
  // Transaction errors
  DEADLOCK_DETECTED: '40001',
  QUERY_TIMEOUT: '57014',
  
  // Data type errors
  INVALID_TEXT_REPRESENTATION: '22P02',
  NUMERIC_VALUE_OUT_OF_RANGE: '22003'
} as const;

/**
 * User-friendly error messages for PostgreSQL errors
 */
export const POSTGRES_ERROR_MESSAGES: Record<string, string> = {
  [POSTGRES_ERROR_CODES.UNIQUE_VIOLATION]: 'A record with this information already exists.',
  [POSTGRES_ERROR_CODES.FOREIGN_KEY_VIOLATION]: 'This record cannot be modified because it is referenced by other data.',
  [POSTGRES_ERROR_CODES.NOT_NULL_VIOLATION]: 'Required field missing. Please check your form and try again.',
  [POSTGRES_ERROR_CODES.UNDEFINED_TABLE]: 'Database table not found. Please contact support.',
  [POSTGRES_ERROR_CODES.UNDEFINED_COLUMN]: 'Database column not found. Please contact support.',
  [POSTGRES_ERROR_CODES.INVALID_PASSWORD]: 'Invalid password. Please try again.',
  [POSTGRES_ERROR_CODES.INVALID_AUTHORIZATION]: 'Authentication failed. Please try signing in again.',
  [POSTGRES_ERROR_CODES.DEADLOCK_DETECTED]: 'Database is temporarily unavailable. Please try again.',
  [POSTGRES_ERROR_CODES.QUERY_TIMEOUT]: 'Query timed out. Please try again with a simpler request.',
  [POSTGRES_ERROR_CODES.INVALID_TEXT_REPRESENTATION]: 'Invalid input format. Please check your data and try again.',
  [POSTGRES_ERROR_CODES.NUMERIC_VALUE_OUT_OF_RANGE]: 'Value out of range. Please check your input and try again.'
};

/**
 * Type guard for PostgrestError
 */
export function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'code' in error
  );
}

/**
 * Get user-friendly error message for PostgreSQL errors
 */
export function getPostgresErrorMessage(error: PostgrestError, context?: string): string {
  const code = typeof error.code === 'string' ? error.code : '';
  const message = POSTGRES_ERROR_MESSAGES[code] || error.message;
  return context ? `${context}: ${message}` : message;
}

/**
 * Convert PostgrestError to DatabaseError with proper context
 */
export function toDatabaseError(
  error: PostgrestError,
  context?: ErrorContext & {
    query?: string;
    params?: unknown;
  }
): DatabaseError {
  const code = typeof error.code === 'string' ? error.code : '';
  const message = getPostgresErrorMessage(error, context?.source);
  
  return createDatabaseError(message, {
    query: context?.query || 'unknown',
    params: context?.params || null,
    constraint: error.details
  });
}

/**
 * Determine if a database error is retryable
 */
export function isRetryableDatabaseError(error: PostgrestError): boolean {
  const code = typeof error.code === 'string' ? error.code : '';
  return code === POSTGRES_ERROR_CODES.DEADLOCK_DETECTED || 
         code === POSTGRES_ERROR_CODES.QUERY_TIMEOUT;
}

/**
 * Determine if a database error affects data integrity
 */
export function isDataIntegrityError(error: PostgrestError): boolean {
  const code = typeof error.code === 'string' ? error.code : '';
  return code === POSTGRES_ERROR_CODES.UNIQUE_VIOLATION || 
         code === POSTGRES_ERROR_CODES.FOREIGN_KEY_VIOLATION || 
         code === POSTGRES_ERROR_CODES.NOT_NULL_VIOLATION;
}

/**
 * Determine if a database error is an authentication error
 */
export function isAuthenticationError(error: PostgrestError): boolean {
  const code = typeof error.code === 'string' ? error.code : '';
  return code === POSTGRES_ERROR_CODES.INVALID_PASSWORD || 
         code === POSTGRES_ERROR_CODES.INVALID_AUTHORIZATION;
}

/**
 * Determine if a database error is a schema error
 */
export function isSchemaError(error: PostgrestError): boolean {
  const code = typeof error.code === 'string' ? error.code : '';
  return code === POSTGRES_ERROR_CODES.UNDEFINED_TABLE || 
         code === POSTGRES_ERROR_CODES.UNDEFINED_COLUMN;
}

/**
 * Get error details from a PostgrestError
 */
export function getErrorDetails(error: PostgrestError): ErrorDetails {
  return {
    code: error.code,
    details: error.details,
    hint: error.hint,
    message: error.message
  };
}

/**
 * Get error context from a PostgrestError
 */
export function getErrorContext(
  error: PostgrestError,
  context?: ErrorContext
): ErrorContext {
  return {
    ...context,
    timestamp: new Date().toISOString(),
    component: 'database',
    method: 'query',
    params: error.details ? { details: error.details } : undefined
  };
} 