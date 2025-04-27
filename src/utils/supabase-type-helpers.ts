
import { PostgrestSingleResponse } from '@supabase/supabase-js';

/**
 * Type guard to check if a response has data
 */
export function hasData<T>(response: PostgrestSingleResponse<T>): response is PostgrestSingleResponse<T> & { data: T } {
  return response.data !== null && !response.error;
}

/**
 * Type guard to check if a value exists
 */
export function exists<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Cast a string to UUID type for Supabase
 */
export function castToUUID(id: string): string {
  return id;
}

/**
 * Safe conversion for database IDs
 */
export function asDbId(id: string): string {
  return id;
}
