
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
 * Alias for hasData - used in some components
 */
export function hasResponseData<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined
): response is (PostgrestResponse<T> & { data: T }) | (PostgrestSingleResponse<T> & { data: T }) {
  return hasData(response);
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
 * Cast a string to a database ID type
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
