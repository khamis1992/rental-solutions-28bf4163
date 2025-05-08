
import { PostgrestSingleResponse, PostgrestResponse, PostgrestError } from '@supabase/supabase-js';

/**
 * Improved type guard to check if a Supabase response has data
 */
export function hasData<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined
): response is (PostgrestResponse<T> & { data: T; error: null }) | (PostgrestSingleResponse<T> & { data: T; error: null }) {
  if (!response) return false;
  if (response.error) return false;
  return response.data !== null && response.data !== undefined;
}

/**
 * Alias for hasData - used in some components for backward compatibility
 */
export function hasResponseData<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined
): response is (PostgrestResponse<T> & { data: T; error: null }) | (PostgrestSingleResponse<T> & { data: T; error: null }) {
  return hasData(response);
}

/**
 * Safely gets error message from a response
 */
export function getErrorMessage(response: { error?: PostgrestError | null } | null | undefined): string {
  return response?.error?.message || 'Unknown error';
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
 * Type guard to check if value is an object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Safe accessor for properties
 */
export function safeGet<T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined {
  if (!obj) return undefined;
  return obj[key];
}

/**
 * Type-safe error handler for Supabase responses
 */
export function handleResponseError<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined,
  errorHandler?: (message: string) => void
): void {
  if (response?.error) {
    const errorMessage = response.error.message || 'Unknown error';
    console.error("Supabase error:", errorMessage);
    errorHandler?.(errorMessage);
  }
}

/**
 * Safe type casting utility for database IDs
 */
export function castDbId(id: string): string {
  return id;
}

/**
 * Cast any string to a UUID type for database operations
 */
export function castToUUID(id: string): string {
  return id;
}

/**
 * Check if a response data property exists
 */
export function hasDataProperty<T, K extends keyof T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined,
  property: K
): boolean {
  if (!hasData(response)) return false;
  return property in response.data;
}

/**
 * Safely access a property from a Supabase response
 */
export function getResponseProperty<T, K extends keyof T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined,
  property: K
): T[K] | null {
  if (!hasData(response)) return null;
  return response.data[property];
}

/**
 * Safe function to check if response has an error
 */
export function hasError<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined
): response is { error: PostgrestError } {
  return !!response?.error;
}

/**
 * Safely extracts response data with proper type assertion
 */
export function extractData<T, R = T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined,
  transform?: (data: T) => R
): R | null {
  if (!hasData(response)) return null;
  if (transform) {
    return transform(response.data);
  }
  return response.data as unknown as R;
}
