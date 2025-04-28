
import { Database } from '@/types/database.types';
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';

// Core database types
export type Tables = Database['public']['Tables'];
export type Schema = keyof Database;
export type DbId = string;

// Table row types
export type TableRow<T extends keyof Tables> = Tables[T]['Row'];
export type TableInsert<T extends keyof Tables> = Tables[T]['Insert'];
export type TableUpdate<T extends keyof Tables> = Tables[T]['Update'];

// Common entity types
export type LeaseRow = TableRow<'leases'>;
export type VehicleRow = TableRow<'vehicles'>;
export type ProfileRow = TableRow<'profiles'>;
export type PaymentRow = TableRow<'unified_payments'>;
export type TrafficFineRow = TableRow<'traffic_fines'>;
export type LegalCaseRow = TableRow<'legal_cases'>;
export type MaintenanceRow = TableRow<'maintenance'>;

// Status types
export type LeaseStatus = LeaseRow['status'];
export type PaymentStatus = string; // Using string as the database type is text
export type VehicleStatus = VehicleRow['status'];
export type ProfileStatus = ProfileRow['status'];
export type MaintenanceStatus = MaintenanceRow['status'];

// Response types for better error handling
export type DbResponse<T> = {
  data: T | null;
  error: Error | null;
  status: 'success' | 'error';
  message?: string;
};

export type DbListResponse<T> = DbResponse<T[]>;
export type DbSingleResponse<T> = DbResponse<T>;

// PostgreSQL response type guards
export type PostgrestResult<T> = PostgrestSingleResponse<T> | PostgrestResponse<T>;

// Type guards for checking if a value exists
export function exists<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// Type guard for valid database responses
export function isSuccessResponse<T>(
  response: PostgrestResult<T>
): response is { data: T; error: null } {
  return !response.error && exists(response.data);
}
