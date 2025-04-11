
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';

export type DbResult<T> = T extends PromiseLike<infer U> ? U : never;
export type DbResultOk<T> = T extends PromiseLike<{ data: infer U }> ? Exclude<U, null> : never;

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
export function hasData<T>(response: PostgrestSingleResponse<T> | PostgrestResponse<T>): response is PostgrestResponse<T> & { data: NonNullable<T> } {
  return !response.error && response.data !== null;
}

/**
 * Safely cast UUID strings
 */
export function castToUUID(id: string): string {
  // Add any UUID validation if needed
  return id as string;
}

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
 * This function is crucial for fixing TypeScript errors when passing IDs to Supabase
 */
export function castDatabaseId(id: string): string {
  return id;
}

/**
 * Safe extractor for Supabase data to prevent "property does not exist" errors
 * 
 * @param data The data from a Supabase query that might be an error or have the property
 * @param propertyName The name of the property to extract
 * @param defaultValue Optional default value if the property doesn't exist
 */
export function safeExtract<T, K extends keyof T>(
  data: T | { error: any } | null | undefined, 
  propertyName: K, 
  defaultValue?: T[K]
): T[K] | undefined {
  if (!data) return defaultValue;
  
  // Check if it's an error object
  if (data && typeof data === 'object' && 'error' in data) {
    return defaultValue;
  }
  
  // Now we know it's the actual data type
  const actualData = data as T;
  
  // Check if the property exists
  if (propertyName in actualData) {
    return actualData[propertyName];
  }
  
  return defaultValue;
}
