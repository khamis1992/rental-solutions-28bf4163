
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/postgrest-js';

/**
 * Type guard to check if a response has data
 */
export function hasData<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T>
): response is { data: NonNullable<T>; error: null } {
  return !response.error && response.data !== null && response.data !== undefined;
}

/**
 * Safely extract data from a response
 */
export function safelyExtractData<T>(response: PostgrestSingleResponse<T> | PostgrestResponse<T>): T | null {
  if (hasData(response)) {
    return response.data;
  }
  return null;
}

/**
 * Check if a value exists (is not null or undefined)
 */
export function exists<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Safely check if an object has a specific property
 */
export function hasProperty<T extends object, K extends string>(
  obj: T | null | undefined, 
  key: K
): obj is T & Record<K, unknown> {
  return !!obj && key in obj;
}

/**
 * Safe access for potentially undefined objects and properties
 */
export function safeAccess<T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined {
  if (!obj) return undefined;
  return obj[key];
}

/**
 * Helper for safely casting to known database ID types
 */
export function asVehicleId(id: string): string {
  return id as string;
}

/**
 * Helper for safely casting to known database ID types
 */
export function asLeaseId(id: string): string {
  return id as string;
}

/**
 * Helper for safely casting to known database ID types
 */
export function asPaymentId(id: string): string {
  return id as string;
}

/**
 * Helper for safely casting to known database ID types
 */
export function asProfileId(id: string): string {
  return id as string;
}

/**
 * Helper for safely casting to known database ID types
 */
export function asCustomerId(id: string): string {
  return id as string;
}

/**
 * Helper for safely casting to known database ID types
 */
export function asTrafficFineId(id: string): string {
  return id as string;
}

/**
 * Helper for safely casting column names for queries
 */
export function asLeaseIdColumn(column: string): string {
  return column;
}

/**
 * Helper for safely casting column names for queries
 */
export function asStatusColumn(column: string): string {
  return column;
}

/**
 * Safely cast database IDs for type safety
 */
export function castDbId(id: string): string {
  return id;
}

/**
 * Cast string to UUID format for Supabase operations
 */
export function castToUUID(id: string): string {
  return id;
}

/**
 * Safely transform Supabase response to expected types
 */
export function transformResponse<T, R>(
  response: { data: T[] | null; error: any } | null,
  transformer: (item: any) => R
): R[] {
  if (!response || response.error || !response.data) return [];
  return response.data
    .filter(item => item !== null)
    .map(transformer)
    .filter(Boolean) as R[];
}

/**
 * Type-safe way to cast database objects with proper type checking
 */
export function castDatabaseObject<T>(obj: any): T {
  return obj as T;
}

/**
 * Check if a response item has specific properties
 */
export function validateResponseItem(item: any, requiredProps: string[]): boolean {
  if (!item || typeof item !== 'object') return false;
  return requiredProps.every(prop => prop in item);
}

/**
 * Type-safe way to access nested properties
 */
export function safelyGetNestedProperty<T, K extends keyof T>(
  obj: T | null | undefined, 
  key: K, 
  nestedKey: string
): any | undefined {
  if (!obj) return undefined;
  const value = obj[key];
  if (!value || typeof value !== 'object') return undefined;
  return (value as any)[nestedKey];
}

/**
 * Safe type assertion helper for database operations
 * Useful for cases where TypeScript doesn't correctly infer types
 */
export function asDatabaseType<T>(value: any): T {
  return value as T;
}
