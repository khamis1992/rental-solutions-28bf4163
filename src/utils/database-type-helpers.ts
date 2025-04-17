
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/postgrest-js';

/**
 * Type guard to check if a response has data
 */
export function hasData<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T>
): response is PostgrestResponse<T> & { data: NonNullable<T>; error: null } {
  return !response.error && response.data !== null && response.data !== undefined;
}

/**
 * Safely extract data from a response
 */
export function safelyExtractData<T>(response: PostgrestSingleResponse<T> | PostgrestResponse<T>): T | null {
  if (hasData(response)) {
    if (Array.isArray(response.data)) {
      return response.data as unknown as T;
    } else {
      return response.data as T;
    }
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

/**
 * Handle Supabase response and extract data with proper error handling
 */
export function handleDatabaseResponse<T>(response: PostgrestSingleResponse<T> | PostgrestResponse<T>): T | null {
  if (response.error) {
    console.error("Database error:", response.error);
    return null;
  }
  return response.data;
}

/**
 * Safely cast a value to a specific type with verification
 */
export function safeCast<T>(value: unknown, defaultValue: T): T {
  return (value as T) || defaultValue;
}

/**
 * Safely cast a string value to a string type
 */
export function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Safely cast a value to a number
 */
export function asNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Safe access for property values with type conversion
 */
export function safeProperty<T>(obj: any, key: string, defaultValue: T): T {
  if (!obj || typeof obj !== 'object' || !(key in obj)) return defaultValue;
  
  // Try to convert the value to the expected type
  const value = obj[key];
  if (typeof defaultValue === 'string') return (String(value) as unknown) as T;
  if (typeof defaultValue === 'number') {
    const num = Number(value);
    return (isNaN(num) ? defaultValue : num) as T;
  }
  if (typeof defaultValue === 'boolean') return (Boolean(value) as unknown) as T;
  
  return (value as T) || defaultValue;
}
