
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

