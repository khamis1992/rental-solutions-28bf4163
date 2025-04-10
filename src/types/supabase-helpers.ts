
import { Database } from './database.types';
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';

export type GenericSchema = Database[keyof Database];
export type TablesInsertResponse<T extends keyof Database['public']['Tables']> = PostgrestResponse<Database['public']['Tables'][T]>;
export type TablesUpdateResponse<T extends keyof Database['public']['Tables']> = PostgrestResponse<Database['public']['Tables'][T]>;

export type DatabaseRecord<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

export const isError = <T>(response: PostgrestSingleResponse<T>): response is { error: Error } => {
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

