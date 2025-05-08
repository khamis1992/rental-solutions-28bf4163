
import { PostgrestError } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

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
export function hasData<T>(response: DbListResponse<T> | DbSingleResponse<T>): response is 
  (DbListResponse<T> & { data: T[]; error: null } | DbSingleResponse<T> & { data: T; error: null }) {
  return response.error === null && response.data !== null;
}

/**
 * Type-safe status check
 */
export function isValidStatus<T extends { status: string }>(record: T, status: T['status']): boolean {
  return record.status === status;
}

// Export commonly used table types
export type LeaseRow = TableRow<'leases'>;
export type PaymentRow = TableRow<'unified_payments'>;
export type VehicleRow = TableRow<'vehicles'>;
export type ProfileRow = TableRow<'profiles'>;
export type TrafficFineRow = TableRow<'traffic_fines'>;
export type LegalCaseRow = TableRow<'legal_cases'>;

// Common status types
export type VehicleStatus = VehicleRow['status']; 
export type LeaseStatus = LeaseRow['status'];
export type PaymentStatus = PaymentRow['status']; 
export type ProfileStatus = ProfileRow['status'];
