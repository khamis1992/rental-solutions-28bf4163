
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/postgrest-js';

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
): boolean {
  return !response.error && response.data !== null;
}

/**
 * Handle Supabase response with proper error logging
 */
export function handleSupabaseResponse<T>(response: PostgrestSingleResponse<T> | PostgrestResponse<T>): T | null {
  if (response.error) {
    console.error('Error in Supabase response:', response.error);
    return null;
  }
  
  if (!response.data) {
    return null;
  }
  
  // Safely handle both single responses and array responses
  return response.data;
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
 * Safely cast database ID value for Supabase UUID operations
 * This is needed to ensure IDs are properly handled in Supabase queries
 */
export const castToUUID = (id: string): string => id;

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

/**
 * Safely check if a response is successful and has data
 */
export function isSuccessResponse<T>(response: PostgrestResponse<T>): boolean {
  return !response.error && response.data !== null;
}

/**
 * Type guard to ensure we have a valid response object
 * before accessing properties
 */
export function ensureResponseHasData<T, K extends keyof T>(
  response: PostgrestResponse<T> | { error: any },
  key: K
): boolean {
  if ('error' in response && response.error) return false;
  if (!('data' in response) || !response.data) return false;
  return key in response.data;
}

/**
 * Retrieve a value from a response with proper type checking
 * Returns defaultValue if the property doesn't exist or response is an error
 */
export function getResponseValue<T, K extends keyof T, D>(
  response: PostgrestResponse<T> | { error: any },
  key: K,
  defaultValue: D
): T[K] | D {
  if (ensureResponseHasData(response, key)) {
    return (response as any).data[key];
  }
  return defaultValue;
}

/**
 * Safely handle a response and extract data with proper error handling
 */
export function handleResponseData<T>(response: PostgrestSingleResponse<T> | PostgrestResponse<T>): T | null {
  if (response.error) {
    console.error('Error in Supabase response:', response.error);
    return null;
  }
  // Handle case where response.data could be array or single object
  if (Array.isArray(response.data)) {
    return response.data.length > 0 ? response.data[0] : null;
  }
  return response.data || null;
}

/**
 * Extract data from an array response, with safe handling
 */
export function handleArrayResponse<T>(response: PostgrestResponse<T[]>): T[] {
  if (response.error || !response.data) {
    console.error('Error in Supabase array response:', response.error);
    return [];
  }
  return response.data;
}
