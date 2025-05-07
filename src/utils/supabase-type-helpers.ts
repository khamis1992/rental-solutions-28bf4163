
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';

/**
 * Type guard to check if a Supabase response has data
 */
export function hasData<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined
): response is (PostgrestResponse<T> & { data: T }) | (PostgrestSingleResponse<T> & { data: T }) {
  if (!response) return false;
  if (response.error) return false;
  return response.data !== null && response.data !== undefined;
}

/**
 * Extract data safely from a Supabase response
 */
export function getResponseData<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined
): T | null {
  if (!hasData(response)) {
    return null;
  }
  return response.data;
}

/**
 * Type guard to check if an object is not null or undefined
 */
export function exists<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Safe accessor for properties
 */
export function safeGet<T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined {
  if (!obj) return undefined;
  return obj[key];
}
