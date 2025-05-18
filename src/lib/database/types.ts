
import { PostgrestError } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
export * from '@/types/database-common';

// Helper type for easy table access
export type Tables = Database['public']['Tables'];
export type Schema = keyof Database;

// Table row types
export type TableRow<T extends keyof Tables> = Tables[T]['Row'];
export type TableInsert<T extends keyof Tables> = Tables[T]['Insert'];
export type TableUpdate<T extends keyof Tables> = Tables[T]['Update'];

// Common ID type
export type DatabaseId = string;
export type UUID = string;

// Database response types
export type DbListResponse<T> = {
  data: T[] | null;
  error: PostgrestError | null;
};

export type DbSingleResponse<T> = {
  data: T | null;
  error: PostgrestError | null;
};

/**
 * Type guard for checking if response has data
 */
export function hasData<T>(response: DbListResponse<T> | DbSingleResponse<T>): response is { data: T | T[]; error: null } {
  return !response.error && response.data !== null;
}

/**
 * Type-safe status check
 */
export function isValidStatus<T extends { status: string }>(record: T, status: T['status']): boolean {
  return record.status === status;
}

