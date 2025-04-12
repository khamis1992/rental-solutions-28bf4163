
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';

/**
 * Safely get data from a Supabase response, returns null if error or no data
 */
export function getResponseData<T>(response: PostgrestSingleResponse<T> | PostgrestResponse<T>): T | null {
  if (!response || response.error || !response.data) {
    console.error('Error in Supabase response:', response?.error);
    return null;
  }
  return response.data;
}

/**
 * Type guard to check if a response has data
 */
export function hasData<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T>
): response is { data: NonNullable<T>; error: null } {
  return !response.error && response.data !== null;
}

/**
 * Safe database ID type 
 */
export type SafeId = string;

/**
 * Generic database record type with ID
 */
export interface DbRecord {
  id: SafeId;
  [key: string]: any;
}

/**
 * Safely cast string ID to database ID type
 */
export const castDbId = (id: string): SafeId => id as SafeId;

/**
 * Safely access nested properties from potentially null/undefined objects
 */
export function getSafeProperty<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K
): T[K] | undefined {
  if (!obj) return undefined;
  return obj[key];
}

/**
 * Safely cast any string ID to the proper database ID type
 */
export function castDatabaseId(id: string): SafeId {
  return id as SafeId;
}
