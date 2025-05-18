
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
export { isSuccessResponse } from './database/validation/typeGuards';
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

// Generic response handler with strong typing
export function handleDatabaseResponse<T>(response: PostgrestResponse<T> | PostgrestSingleResponse<T>): T | null {
  if (response.error) {
    console.error('Database error:', response.error);
    return null;
  }
  return (response.data as unknown as T) || null;
}

// Type guard for responses

// Type safe ID converter
export function asTableId<T extends keyof Tables>(table: T, id: string): Tables[T]['Row']['id'] {
  return id as Tables[T]['Row']['id'];
}

// Type guard for checking if response has data
export function hasData<T>(response: PostgrestResponse<T> | PostgrestSingleResponse<T>): response is { data: T; error: null } {
  return !response.error && response.data !== null;
}

// Type-safe column selector
export function selectColumn<T extends keyof Tables, K extends keyof Tables[T]['Row']>(
  table: T,
  column: K
): K {
  return column;
}

// Type-safe status check
export function isValidStatus<T extends { status: string }>(record: T, status: T['status']): boolean {
  return record.status === status;
}

// Re-export common types
export type { LeaseRow, PaymentRow, VehicleRow, ProfileRow, TrafficFineRow, LegalCaseRow } from '@/types/database-common';
export type { VehicleStatus, LeaseStatus, PaymentStatus, ProfileStatus } from '@/types/database-common';

export function asStatus<T extends { status: string }>(status: string): T['status'] {
  return status as T['status'];
}

