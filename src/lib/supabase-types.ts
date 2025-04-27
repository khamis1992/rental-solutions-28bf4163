
import { Database } from '@/types/database.types';
import { asUUID, UUID } from '@/lib/uuid-helpers';
import { getResponseData } from '@/utils/supabase-type-helpers';

type Tables = Database['public']['Tables'];

// Helper type for database IDs that enforces UUID format
export type DbId = UUID;

// Helper type for payment status that matches the database enum
export type PaymentStatus = Tables['unified_payments']['Row']['status'];

// Helper type for legal case status that matches the database enum
export type LegalCaseStatus = Tables['legal_cases']['Row']['status'];

// Helper type for vehicle status that matches the database enum
export type VehicleStatus = Tables['vehicles']['Row']['status'];

// Helper type for agreement status that matches the database enum
export type AgreementStatus = Tables['leases']['Row']['status'];

// Helper function to cast IDs to the correct type
export const castDbId = (id: string): DbId => asUUID(id);

// Helper function to cast payment status to the correct type
export const castPaymentStatus = (status: string): PaymentStatus => status as PaymentStatus;

// Helper function to cast legal case status to the correct type
export const castLegalCaseStatus = (status: string): LegalCaseStatus => status as LegalCaseStatus;

// Helper function to cast vehicle status to the correct type
export const castVehicleStatus = (status: string): VehicleStatus => status as VehicleStatus;

// Helper function to cast agreement status to the correct type 
export const castAgreementStatus = (status: string): AgreementStatus => status as AgreementStatus;

// Helper function to handle Supabase response errors
export const handleSupabaseResponse = <T>(response: any): T | null => {
  if (response?.error) {
    console.error("Supabase response error:", response.error);
    return null;
  }
  return response?.data ?? null;
};

/**
 * Type-guard to check if an object is a specific database table row
 */
export function isTableRow<T extends keyof Tables>(
  tableName: T, 
  obj: any
): obj is Tables[T]['Row'] {
  return obj && typeof obj === 'object' && 'id' in obj;
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
 * Safely cast a string value to a database column value
 */
export function asColumnValue<
  T extends keyof Tables, 
  C extends keyof Tables[T]['Row']
>(table: T, column: C, value: any): Tables[T]['Row'][C] {
  return value as Tables[T]['Row'][C];
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
    castId: (id: string) => id as any as Tables[T]['Row']['id'],
    castColumnValue: <C extends keyof Tables[T]['Row']>(
      column: C, 
      value: any
    ): Tables[T]['Row'][C] => value as Tables[T]['Row'][C]
  };
}

// Create helpers for common tables
export const Tables = {
  leases: createTableHelper('leases'),
  profiles: createTableHelper('profiles'),
  vehicles: createTableHelper('vehicles'),
  legal_cases: createTableHelper('legal_cases'),
  unified_payments: createTableHelper('unified_payments'),
  traffic_fines: createTableHelper('traffic_fines'),
};

export type TableName = keyof Database['public']['Tables'];
export type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row'];

export function asTableId<T extends TableName>(table: T, id: string) {
  return id as unknown as TableRow<T>['id'];
}
