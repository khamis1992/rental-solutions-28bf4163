
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
