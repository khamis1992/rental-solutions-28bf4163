
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';

/**
 * Type guard to check if Supabase response contains data
 */
export function hasResponseData<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined
): response is { data: T; error: null } {
  if (!response) return false;
  if (response.error) return false;
  return response.data !== null && response.data !== undefined;
}

/**
 * Check if response has an error
 */
export function hasResponseError<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined
): response is { error: Error; data: null } {
  if (!response) return false;
  return !!response.error;
}

/**
 * Get response data safely
 */
export function getResponseData<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined,
  defaultValue: T | null = null
): T | null {
  if (!response || response.error || !response.data) {
    return defaultValue;
  }
  return response.data;
}

/**
 * Type guard to check if a PostgrestResponse has data
 */
export function isSuccessResponse<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T>
): response is { data: T; error: null } {
  return !response.error && response.data !== null;
}

/**
 * Safely extract a property from a potentially undefined object
 */
export function safeGet<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K,
  defaultValue?: T[K]
): T[K] | undefined {
  if (obj === null || obj === undefined) return defaultValue;
  return obj[key] ?? defaultValue;
}
