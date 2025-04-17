
import { Database } from './database.types';
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';
import { castToUUID } from '@/utils/supabase-type-helpers';
import { exists } from '@/utils/response-mapper';
// Removed the hasProperty import to avoid duplication

export type GenericSchema = Database[keyof Database];
export type TablesInsertResponse<T extends keyof Database['public']['Tables']> = PostgrestResponse<Database['public']['Tables'][T]>;
export type TablesUpdateResponse<T extends keyof Database['public']['Tables']> = PostgrestResponse<Database['public']['Tables'][T]>;

export type DatabaseRecord<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

export const isError = <T>(response: PostgrestSingleResponse<T>): boolean => {
  return 'error' in response && response.error !== null;
};

export const safelyGetRecordFromResponse = <T>(
  response: PostgrestSingleResponse<T> | null
): T | null => {
  if (!response || isError(response)) {
    return null;
  }
  return response.data;
};

export const safelyGetRecordsFromResponse = <T>(
  response: PostgrestResponse<T> | null
): T[] => {
  if (!response || !response.data) {
    return [];
  }
  return response.data;
};

// Type guard to check if a value exists in object
export const hasProperty = <T extends object, K extends string>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> => {
  return key in obj;
};

// Safe property accessor
export const getPropertySafely = <T extends object, K extends keyof T>(
  obj: T | null | undefined,
  key: K
): T[K] | undefined => {
  if (!obj) return undefined;
  return obj[key];
};

/**
 * Safely cast ID to UUID string for Supabase operations
 * @param id ID string to cast
 * @returns The same ID with proper typing for database operations
 */
export function castDbId<T extends string>(id: T): string {
  return castToUUID(id);
}

/**
 * Enhanced type guard to check if a database response has data and is not an error
 * @param response The Supabase response object
 * @returns Boolean indicating if the response has valid data
 */
export function isValidDbResponse<T>(response: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined): response is (PostgrestResponse<T> & { data: T }) {
  if (!response) return false;
  if (response.error) return false;
  if (!response.data) return false;
  return true;
}

/**
 * Type guard to check if the data is a valid database record with expected properties
 * @param data Any data object
 * @param requiredProps Array of required property names to validate
 * @returns Boolean indicating if the data is a valid record
 */
export function isValidRecord<T>(data: unknown, requiredProps: string[]): data is T {
  if (!data || typeof data !== 'object') return false;
  return requiredProps.every(prop => hasProperty(data as object, prop));
}

/**
 * Safe Supabase query execution wrapper
 * @param queryFn A function that performs a Supabase query
 * @param errorMessage Optional custom error message
 * @returns The query result or null if error
 */
export async function safeQueryExecution<T>(
  queryFn: () => Promise<PostgrestSingleResponse<T> | PostgrestResponse<T>>,
  errorMessage?: string
): Promise<T | T[] | null> {
  try {
    const response = await queryFn();
    
    if (response.error) {
      console.error(errorMessage || 'Database query error:', response.error);
      return null;
    }
    
    if (!response.data) {
      console.warn(errorMessage || 'No data returned from database query');
      return null;
    }
    
    return response.data;
  } catch (error) {
    console.error(errorMessage || 'Unexpected error during database query:', error);
    return null;
  }
}

/**
 * Helper to convert response data to strongly typed objects
 */
export function mapResponseData<T, R>(data: T | T[] | null, mapper: (item: T) => R): R | R[] | null {
  if (data === null) return null;
  
  if (Array.isArray(data)) {
    return data.map(item => mapper(item));
  }
  
  return mapper(data);
}
