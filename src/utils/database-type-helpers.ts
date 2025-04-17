
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
 * Check if a response item has specific properties
 */
export function validateResponseItem(item: any, requiredProps: string[]): boolean {
  if (!item || typeof item !== 'object') return false;
  return requiredProps.every(prop => prop in item);
}
