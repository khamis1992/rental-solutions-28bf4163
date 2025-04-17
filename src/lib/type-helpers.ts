
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { exists } from '@/utils/database-type-helpers';

/**
 * Type for database ID that ensures consistent typing across the application
 */
export type DatabaseId = string;

/**
 * Type guard to check if a value is a valid DatabaseId
 */
export function isValidDatabaseId(id: unknown): id is DatabaseId {
  return typeof id === 'string' && id.length > 0;
}

/**
 * Safely cast any string ID to the proper database ID type
 * This is a type assertion function that helps TypeScript understand the type
 */
export function asDatabaseId(id: string): DatabaseId {
  return id;
}

/**
 * Type guard to check if a response has data
 */
export function hasResponseData<T>(
  response: PostgrestResponse<T> | PostgrestSingleResponse<T> | null | undefined
): boolean {
  return !!response && !response.error && response.data !== null;
}

/**
 * Type safe accessor for response data
 */
export function getResponseData<T>(
  response: PostgrestResponse<T> | PostgrestSingleResponse<T> | null | undefined
): T | null {
  if (!response) return null;
  if (response.error) {
    console.error('Error in response:', response.error.message);
    return null;
  }
  
  return response.data as T;
}

/**
 * Function to safely check if an object has a property
 */
export function hasObjectProperty<T extends object, K extends string>(
  obj: T | null | undefined, 
  prop: K
): obj is T & Record<K, unknown> {
  return !!obj && prop in obj;
}

/**
 * Get a typed property from an object with a default value
 */
export function getTypedProperty<T, K extends keyof T, D>(
  obj: T | null | undefined,
  key: K,
  defaultValue: D
): T[K] | D {
  if (!obj) return defaultValue;
  const value = obj[key];
  return value !== undefined && value !== null ? value : defaultValue;
}

/**
 * Handle Supabase response with proper error logging
 */
export function handleResponse<T>(response: PostgrestSingleResponse<T>): T | null {
  if (!response) return null;
  if (response.error) {
    console.error('Database error:', response.error);
    return null;
  }
  return response.data;
}

/**
 * Safe type assertion for potentially undefined values
 */
export function asType<T>(value: unknown, defaultValue: T): T {
  return (value as T) || defaultValue;
}

/**
 * Function to safely extract array response data
 */
export function safeArrayData<T>(response: PostgrestResponse<T[]> | null): T[] {
  if (!response || response.error || !response.data) return [] as T[];
  return response.data as T[];
}

/**
 * Ensure a value is an array
 */
export function ensureArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

/**
 * Function to safely cast string to numerical ID
 */
export function asNumericId(id: string | number): number {
  if (typeof id === 'number') return id;
  const numId = parseInt(id, 10);
  return isNaN(numId) ? 0 : numId;
}
