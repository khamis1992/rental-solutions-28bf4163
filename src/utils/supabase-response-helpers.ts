
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';

/**
 * Type guard for checking if a Supabase response has data and no error
 */
export function hasResponseData<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined
): response is (PostgrestResponse<T> & { data: T[] }) | (PostgrestSingleResponse<T> & { data: T }) {
  return !!(response && !response.error && response.data !== null && response.data !== undefined);
}

/**
 * Type guard to check if a value is a valid object (not null/undefined)
 */
export function isObject<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Extract data safely from a Supabase single response
 */
export function extractSingleResponseData<T>(
  response: PostgrestSingleResponse<T> | null | undefined
): T | null {
  if (!response || response.error || !response.data) return null;
  return response.data;
}

/**
 * Extract data safely from a Supabase response which returns an array
 */
export function extractArrayResponseData<T>(
  response: PostgrestResponse<T> | null | undefined
): T[] {
  if (!response || response.error || !response.data) return [];
  return Array.isArray(response.data) ? response.data : [];
}

/**
 * Handle errors from Supabase responses
 */
export function handleResponseError(
  response: PostgrestSingleResponse<any> | PostgrestResponse<any> | null | undefined,
  defaultErrorMessage: string = 'An error occurred'
): string | null {
  if (!response) return defaultErrorMessage;
  if (response.error) return response.error.message || defaultErrorMessage;
  return null;
}

/**
 * Safe property accessor for potentially null objects
 */
export function safeGetProperty<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K
): T[K] | undefined {
  if (!obj) return undefined;
  return obj[key];
}
