
import { Database } from '@/types/database.types';
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';

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
  return response.data || null;
}

// Type guard for responses
export function isSuccessResponse<T>(response: PostgrestResponse<T> | PostgrestSingleResponse<T>): response is { data: T; error: null } {
  return !response.error && response.data !== null;
}

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

// Export commonly used table types
export type LeaseRow = Tables['leases']['Row'];
export type PaymentRow = Tables['unified_payments']['Row'];
export type VehicleRow = Tables['vehicles']['Row'];
export type ProfileRow = Tables['profiles']['Row'];
export type TrafficFineRow = Tables['traffic_fines']['Row'];
export type LegalCaseRow = Tables['legal_cases']['Row'];

// Common status types
export type VehicleStatus = VehicleRow['status']; 
export type LeaseStatus = LeaseRow['status'];
export type PaymentStatus = PaymentRow['status']; 
export type ProfileStatus = ProfileRow['status'];

export function asStatus<T extends { status: string }>(status: string): T['status'] {
  return status as T['status'];
}
