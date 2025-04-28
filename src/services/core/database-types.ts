
import { Database } from '@/types/database.types';
import { PostgrestError, PostgrestSingleResponse } from '@supabase/supabase-js';

export type Tables = Database['public']['Tables'];
export type SchemaName = keyof Database;

// Type-safe table row types
export type LeaseRow = Tables['leases']['Row'];
export type VehicleRow = Tables['vehicles']['Row'];
export type ProfileRow = Tables['profiles']['Row'];
export type PaymentRow = Tables['unified_payments']['Row'];

// Common status types
export type LeaseStatus = LeaseRow['status'];
export type VehicleStatus = VehicleRow['status'];
export type ProfileStatus = ProfileRow['status'];
export type PaymentStatus = PaymentRow['status'];

// Database response types
export type DbResult<T> = PostgrestSingleResponse<T>;
export type DbError = PostgrestError;

// Type guard for checking valid responses
export function isValidDbResponse<T>(response: DbResult<T>): response is DbResult<T> & { data: T } {
  return !response.error && response.data !== null;
}

