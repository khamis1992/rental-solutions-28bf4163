
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';

/**
 * Type guard to check if response data is valid and has the expected property
 * @param response - The Supabase response
 * @param property - The property to check for
 */
export function isValidResponse<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined
): response is { data: NonNullable<T>; error: null } {
  return Boolean(response && !response.error && response.data);
}

/**
 * Type guard to check if an object has a specific property
 * @param obj - The object to check
 * @param prop - The property to check for
 */
export function hasProperty<T extends object, K extends string>(
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
export function safeProperty<T, K extends keyof T>(obj: T | null | undefined, prop: K, fallback: T[K]): T[K] {
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
 * Type guard to check if a response is an error
 */
export function isErrorResponse(response: any): response is { error: Error } {
  return response && response.error !== null && response.error !== undefined;
}

/**
 * Safe database query execution that handles errors
 */
export async function safeQueryExecution<T>(
  queryFn: () => Promise<PostgrestSingleResponse<T> | PostgrestResponse<T>>,
  errorHandler?: (error: any) => void
): Promise<T | null> {
  try {
    const response = await queryFn();
    
    if (response.error) {
      console.error("Database query error:", response.error);
      errorHandler?.(response.error);
      return null;
    }
    
    return response.data as T;
  } catch (error) {
    console.error("Unexpected error during query execution:", error);
    errorHandler?.(error);
    return null;
  }
}

/**
 * Type-safe error extraction
 */
export function getErrorMessage(error: any): string {
  if (typeof error === 'object' && error !== null) {
    return error.message || error.toString() || 'Unknown error';
  }
  return String(error || 'Unknown error');
}
