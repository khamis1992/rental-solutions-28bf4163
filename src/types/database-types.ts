import { Database } from './database';
import { asUUID, UUID } from '@/lib/uuid-helpers';
import { getResponseData } from '@/utils/supabase-type-helpers';
import { PostgrestError } from '@supabase/supabase-js';

type Tables = Database['public']['Tables'];

// Helper type for database IDs that enforces UUID format
export type DbId = UUID;

// Helper function to cast IDs to the correct type
export function asDbId<T extends DbId>(id: string): T {
  return asUUID(id) as T;
}

// Type aliases for specific entity IDs
export type LeaseId = Tables['leases']['Row']['id'];
export type VehicleId = Tables['vehicles']['Row']['id'];
export type ProfileId = Tables['profiles']['Row']['id'];
export type PaymentId = Tables['unified_payments']['Row']['id'];
export type AgreementId = LeaseId; // Alias for backward // compatibility - removed unused variable// Helper type for payment status that matches the database enum
export type PaymentStatus = Tables['unified_payments']['Row']['status'];

// Helper type for vehicle status that matches the database enum
export type VehicleStatus = Tables['vehicles']['Row']['status'];

// Helper type for agreement status that matches the database enum
export type AgreementStatus = Tables['leases']['Row']['status'];

// Helper function to cast payment status to the correct type
export const castPaymentStatus = (status: string): PaymentStatus => status as PaymentStatus;

// Helper function to cast vehicle status to the correct type
export const castVehicleStatus = (status: string): VehicleStatus => status as VehicleStatus;

// Helper function to cast agreement status to the correct type 
export const castAgreementStatus = (status: string): AgreementStatus => status as AgreementStatus;

// Helper function to handle Supabase response errors
export const handleSupabaseResponse = <T>(response: { data: T | null; error: PostgrestError | null }): T | null => {
  if (response?.error) {
    console.error("Supabase response error:", response.error);
    return null;
  }
  return response?.data ?? null;
};

/**
 * Type-guard to check if an object is a specific database table row
 */
export function isTableRow<T extends keyof Database['public']['Tables']>(
  tableName: T, 
  obj: unknown
): obj is Database['public']['Tables'][T]['Row'] {
  if (!obj || typeof obj !== 'object') return false;
  const row = obj as Record<string, unknown>;
  return 'id' in row && typeof row.id === 'string';
}

/**
 * Get type-safe column name for a table for use in filters
 */
export function getColumnName<
  T extends keyof Tables, 
  C extends keyof Tables[T]['Row']
>(table: T, column: C): C {
  return column;
}

/**
 * Safely cast a value to a database column value
 */
export function asColumnValue<
  T extends keyof Database['public']['Tables'], 
  C extends keyof Database['public']['Tables'][T]['Row']
>(
  table: T, 
  column: C, 
  value: unknown
): Database['public']['Tables'][T]['Row'][C] {
  if (value === null || value === undefined) {
    return value as Database['public']['Tables'][T]['Row'][C];
  }
  
  const columnType = typeof ({} as Database['public']['Tables'][T]['Row'])[column];
  if (typeof value === columnType) {
    return value as Database['public']['Tables'][T]['Row'][C];
  }
  
  throw new Error(`Invalid type for column ${String(column)} in table ${String(table)}`);
}

/**
 * Creates a strongly typed reference to a table column for use in queries
 */
export function column<T extends keyof Tables, C extends keyof Tables[T]['Row']>(
  table: T, 
  columnName: C
): string {
  return columnName as string;
}

/**
 * Create a type-safe table schema helper
 */
export function createTableHelper<T extends keyof Tables>(table: T) {
  return {
    tableName: table,
    column: <C extends keyof Tables[T]['Row']>(columnName: C) => columnName,
    castId: (id: string) => id as Tables[T]['Row']['id'],
    castColumnValue: <C extends keyof Tables[T]['Row']>(
      column: C, 
      value: unknown
    ): Tables[T]['Row'][C] => value as Tables[T]['Row'][C]
  };
}

// Create helpers for common tables
export const Tables = {
  leases: createTableHelper('leases'),
  profiles: createTableHelper('profiles'),
  vehicles: createTableHelper('vehicles'),
  unified_payments: createTableHelper('unified_payments'),
};
