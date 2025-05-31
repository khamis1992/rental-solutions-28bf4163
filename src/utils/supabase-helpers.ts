import { PostgrestError, PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';
import { 
  Result, 
  createSuccessResult, 
  createErrorResult,
  AppError,
  createErrorResponse,
  createSuccessResponse,
  createDatabaseError,
  type ApiResponse,
  isErrorResponse as isStandardErrorResponse,
  ErrorSeverity
} from '@/types/error.types';
import { toAppError } from '@/lib/errors/error-handler';
import { errorLogger } from '@/lib/errors/error-logger';
import { Database } from '@/types/database.types';
import {
  isSingleResponse,
  isArrayResponse,
  hasValidData,
  isError,
  ToResult,
  ToResultArray,
  ToResultSingle
} from '@/types/supabase-response.types';

// Type for handling Supabase response with proper error typing
type SupabaseResponse<T> = Result<T>;
type SupabaseArrayResponse<T> = Result<T[]>;

// Type for handling both single and array responses
type SupabaseDataResponse<T> = T extends any[] ? SupabaseArrayResponse<T[number]> : SupabaseResponse<T>;

// Re-export the standardized error response type guard
export const isErrorResponse = isStandardErrorResponse;

/**
 * Type guard to check if response data is valid and has the expected property
 */
export function isValidResponse<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined
): response is { data: NonNullable<T>; error: null } {
  return hasValidData(response);
}

/**
 * Type guard to check if an object has a specific property
 * @param obj - The object to check
 * @param prop - The property to check for
 */
export function hasProperty<T extends Record<string, any>, K extends string>(
  obj: T, 
  prop: K
): obj is T & Record<K, unknown> {
  return obj !== null && typeof obj === 'object' && prop in obj;
}

/**
 * Safe access to response data
 * @param response - The Supabase response
 * @param defaultValue - Default value if the response is invalid
 */
export function safeResponseData<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined,
  defaultValue: T | null = null
): T | null {
  if (isValidResponse(response)) {
    return response.data;
  }
  return defaultValue;
}

/**
 * Safe property access with fallback
 * @param obj - The object to access
 * @param prop - The property to access
 * @param fallback - Fallback value if property doesn't exist
 */
export function safeProperty<T extends Record<string, any>, K extends keyof T>(obj: T | null | undefined, prop: K, fallback: T[K]): T[K] {
  if (obj !== null && obj !== undefined && prop in obj) {
    return obj[prop];
  }
  return fallback;
}

/**
 * Safe type casting with error checking
 * @param response - Supabase response to check
 * @param transform - Function to transform response data if valid
 */
export function safeTransform<T, R>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined,
  transform: (data: T) => R
): R | null {
  if (isValidResponse(response)) {
    return transform(response.data);
  }
  return null;
}

/**
 * Safe database query execution for single items
 */
export async function safeSingleQueryExecution<T>(
  queryFn: () => Promise<PostgrestSingleResponse<T>>
): Promise<ToResultSingle<T>> {
  try {
    const response = await queryFn();
    
    if (isError(response)) {
      const error = toAppError(response.error);
      errorLogger.logError(error, 'high', {
        source: 'Database',
        operation: 'safeSingleQueryExecution',
        details: { response }
      });
      return createErrorResult<T>(error);
    }

    if (!response.data) {
      const error = toAppError(new Error('No data returned from database query'));
      errorLogger.logError(error, 'medium', {
        source: 'Database',
        operation: 'safeSingleQueryExecution'
      });
      return createErrorResult<T>(error);
    }

    return createSuccessResult(response.data);
  } catch (error) {
    const appError = toAppError(error);
    errorLogger.logError(error, 'high', {
      source: 'Database',
      operation: 'safeSingleQueryExecution',
      details: { error: appError }
    });
    return createErrorResult<T>(appError);
  }
}

/**
 * Safe database query execution for arrays
 */
export async function safeArrayQueryExecution<T>(
  queryFn: () => Promise<PostgrestResponse<T>>
): Promise<ToResultArray<T>> {
  try {
    const response = await queryFn();
    
    if (isError(response)) {
      const error = toAppError(response.error);
      errorLogger.logError(error, 'high', {
        source: 'Database',
        operation: 'safeArrayQueryExecution',
        details: { response }
      });
      return createErrorResult<T[]>(error);
    }

    if (!response.data) {
      const error = toAppError(new Error('No data returned from database query'));
      errorLogger.logError(error, 'medium', {
        source: 'Database',
        operation: 'safeArrayQueryExecution'
      });
      return createErrorResult<T[]>(error);
    }

    return createSuccessResult(response.data);
  } catch (error) {
    const appError = toAppError(error);
    errorLogger.logError(error, 'high', {
      source: 'Database',
      operation: 'safeArrayQueryExecution',
      details: { error: appError }
    });
    return createErrorResult<T[]>(appError);
  }
}

/**
 * Safely executes a database query and handles errors
 */
export async function safeQueryExecution<T>(
  query: Promise<PostgrestResponse<T>>,
  context?: string
): Promise<Result<T[]>> {
  try {
    const response = await query;
    
    if (response.error) {
      const error = toAppError(response.error);
      errorLogger.logError(error, 'high', {
        source: 'Database',
        operation: 'safeQueryExecution',
        context,
        details: { response }
      });
      return createErrorResult<T[]>(error);
    }
    
    if (!response.data) {
      const error = createDatabaseError('No data returned from query', {
        query: 'unknown',
        params: null
      });
      errorLogger.logError(error, 'medium', {
        source: 'Database',
        operation: 'safeQueryExecution',
        context
      });
      return createErrorResult<T[]>(error);
    }
    
    return createSuccessResult(response.data);
  } catch (error) {
    const appError = toAppError(error);
    errorLogger.logError(error, 'high', {
      source: 'Database',
      operation: 'safeQueryExecution',
      context,
      details: { error: appError }
    });
    return createErrorResult<T[]>(appError);
  }
}

/**
 * Safely gets a single record from a database response
 */
export function safelyGetRecordFromResponse<T>(
  response: PostgrestSingleResponse<T>,
  context?: string
): Result<T> {
  if (response.error) {
    const error = toAppError(response.error);
    errorLogger.logError(error, 'high', {
      source: 'Database',
      operation: 'safelyGetRecordFromResponse',
      context,
      details: { response }
    });
    return createErrorResult<T>(error);
  }
  
  if (!response.data) {
    const error = createDatabaseError('No data returned from query', {
      query: 'unknown',
      params: null
    });
    errorLogger.logError(error, 'medium', {
      source: 'Database',
      operation: 'safelyGetRecordFromResponse',
      context
    });
    return createErrorResult<T>(error);
  }
  
  return createSuccessResult(response.data);
}

/**
 * Safely gets multiple records from a database response
 */
export function safelyGetRecordsFromResponse<T>(
  response: PostgrestResponse<T>,
  context?: string
): Result<T[]> {
  if (response.error) {
    const error = toAppError(response.error);
    errorLogger.logError(error, 'high', {
      source: 'Database',
      operation: 'safelyGetRecordsFromResponse',
      context,
      details: { response }
    });
    return createErrorResult<T[]>(error);
  }
  
  if (!response.data) {
    const error = createDatabaseError('No data returned from query', {
      query: 'unknown',
      params: null
    });
    errorLogger.logError(error, 'medium', {
      source: 'Database',
      operation: 'safelyGetRecordsFromResponse',
      context
    });
    return createErrorResult<T[]>(error);
  }
  
  return createSuccessResult(response.data);
}

/**
 * Handles database errors with proper error typing
 */
export function handleDatabaseError<T>(error: PostgrestError | unknown): ApiResponse<T> {
  const appError = toAppError(error);
  errorLogger.logError(error, 'high', {
    source: 'Database',
    operation: 'handleDatabaseError',
    details: { error: appError },
    timestamp: new Date().toISOString()
  });
  return createErrorResponse(appError);
}

// Helper to handle single item database responses
export function handleSingleDatabaseResponse<T>(
  response: PostgrestSingleResponse<T>
): ApiResponse<T> {
  if (response?.error) {
    const error = toAppError(response.error);
    errorLogger.logError(error, 'high', {
      source: 'Database',
      operation: 'handleSingleDatabaseResponse',
      details: { response }
    });
    return createErrorResponse(error);
  }
  
  if (!response?.data) {
    const error = toAppError(new Error('No data returned from database query'));
    errorLogger.logError(error, 'medium', {
      source: 'Database',
      operation: 'handleSingleDatabaseResponse'
    });
    return createErrorResponse(error);
  }
  
  return createSuccessResponse(response.data);
}

// Helper to handle array database responses
export function handleArrayDatabaseResponse<T>(
  response: PostgrestResponse<T>
): ApiResponse<T[]> {
  if (response?.error) {
    const error = toAppError(response.error);
    errorLogger.logError(error, 'high', {
      source: 'Database',
      operation: 'handleArrayDatabaseResponse',
      details: { response }
    });
    return createErrorResponse(error);
  }
  
  if (!response?.data) {
    const error = toAppError(new Error('No data returned from database query'));
    errorLogger.logError(error, 'medium', {
      source: 'Database',
      operation: 'handleArrayDatabaseResponse'
    });
    return createErrorResponse(error);
  }
  
  return createSuccessResponse(response.data);
}

// Helper to validate single item database response
export function validateSingleDatabaseResponse<T>(
  response: PostgrestSingleResponse<T>
): ToResultSingle<T> {
  if (response.error) {
    const error = toAppError(response.error);
    errorLogger.logError(error, 'high', {
      source: 'Database',
      operation: 'validateSingleDatabaseResponse',
      details: { response }
    });
    return createErrorResult<T>(error);
  }

  if (!response.data) {
    const error = toAppError(new Error('No data in database response'));
    errorLogger.logError(error, 'medium', {
      source: 'Database',
      operation: 'validateSingleDatabaseResponse'
    });
    return createErrorResult<T>(error);
  }

  return createSuccessResult(response.data);
}

// Helper to validate array database response
export function validateArrayDatabaseResponse<T>(
  response: PostgrestResponse<T>
): ToResultArray<T> {
  if (response.error) {
    const error = toAppError(response.error);
    errorLogger.logError(error, 'high', {
      source: 'Database',
      operation: 'validateArrayDatabaseResponse',
      details: { response }
    });
    return createErrorResult<T[]>(error);
  }

  if (!response.data) {
    const error = toAppError(new Error('No data in database response'));
    errorLogger.logError(error, 'medium', {
      source: 'Database',
      operation: 'validateArrayDatabaseResponse'
    });
    return createErrorResult<T[]>(error);
  }

  return createSuccessResult(response.data);
}

// Helper to convert response to array safely
export function toArray<T>(data: T | T[] | null | undefined): T[] {
  if (data === null || data === undefined) {
    return [];
  }
  return Array.isArray(data) ? data : [data];
}

// Helper to extract a single item from a response
export function extractSingleItem<T>(data: T | T[] | null): T | null {
  if (data === null) return null;
  if (Array.isArray(data)) {
    return data.length > 0 ? data[0] : null;
  }
  return data;
}

/**
 * Helper to handle both string errors and PostgrestError safely
 */
export function handleQueryError<T>(error: string | PostgrestError | unknown): T[] {
  const appError = toAppError(error);
  errorLogger.logError(error, 'medium', {
    source: 'Database',
    operation: 'handleQueryError',
    details: { error: appError },
    timestamp: new Date().toISOString()
  });
  return [];
}
