
import { Database } from '@/types/database.types';
import { PostgrestError, PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';
import { LeaseStatus } from '@/types/lease-types';

type Tables = Database['public']['Tables'];

// Helper type for database IDs that enforces UUID format
export type UUID = string;

// Helper function to cast IDs to the correct type
export function asUUID(id: string): UUID {
  return id as UUID;
}

// Helper function to cast IDs to the correct type
export function asDbId<T extends UUID>(id: string): T {
  return asUUID(id) as T;
}

// Type aliases for specific entity IDs
export type LeaseId = Tables['leases']['Row']['id'];
export type VehicleId = Tables['vehicles']['Row']['id'];
export type ProfileId = Tables['profiles']['Row']['id'];
export type PaymentId = Tables['unified_payments']['Row']['id'];
export type TrafficFineId = Tables['traffic_fines']['Row']['id'];
export type LegalCaseId = Tables['legal_cases']['Row']['id'];
export type AgreementId = LeaseId; // Alias for backward compatibility

// Helper type for payment status that matches the database enum
export type PaymentStatus = Tables['unified_payments']['Row']['status'];

// Helper type for legal case status that matches the database enum
export type LegalCaseStatus = Tables['legal_cases']['Row']['status'];

// Helper type for vehicle status that matches the database enum
export type VehicleStatus = Tables['vehicles']['Row']['status'];

// Helper type for agreement status that matches the database enum
export type AgreementStatus = Tables['leases']['Row']['status'];

// Type-safe ID casting functions
export function asLeaseId(id: string): LeaseId {
  return id as LeaseId;
}

export function asVehicleId(id: string): VehicleId {
  return id as VehicleId;
}

export function asProfileId(id: string): ProfileId {
  return id as ProfileId;
}

export function asPaymentId(id: string): PaymentId {
  return id as PaymentId;
}

export function asTrafficFineId(id: string): TrafficFineId {
  return id as TrafficFineId;
}

export function asLegalCaseId(id: string): LegalCaseId {
  return id as LegalCaseId;
}

// Type-safe status casting functions
export function asLeaseStatus(status: string): LeaseStatus {
  return status as LeaseStatus;
}

export function asVehicleStatus(status: string): VehicleStatus {
  return status as VehicleStatus;
}

export function asPaymentStatus(status: string): PaymentStatus {
  return status as PaymentStatus;
}

/**
 * Type guard to check if a response has data
 */
export function hasData<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T>
): response is PostgrestResponse<T> & { data: T; error: null } {
  return !response.error && response.data !== null;
}

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
 * Helper function for checking if status is valid
 */
export function isValidStatus<T extends { status: string }>(record: T, status: T['status']): boolean {
  return record.status === status;
}

// Type-safe cast functions for statuses
export const castPaymentStatus = (status: string): PaymentStatus => status as PaymentStatus;
export const castLegalCaseStatus = (status: string): LegalCaseStatus => status as LegalCaseStatus;
export const castVehicleStatus = (status: string): VehicleStatus => status as VehicleStatus;
export const castAgreementStatus = (status: string): AgreementStatus => status as AgreementStatus;

// Helper function to handle Supabase response errors
export const handleSupabaseResponse = <T>(response: any): T | null => {
  if (response?.error) {
    console.error("Supabase response error:", response.error);
    return null;
  }
  return response?.data ?? null;
};

// Create helpers for common tables
export const Tables = {
  leases: createTableHelper('leases'),
  profiles: createTableHelper('profiles'),
  vehicles: createTableHelper('vehicles'),
  legal_cases: createTableHelper('legal_cases'),
  unified_payments: createTableHelper('unified_payments'),
  traffic_fines: createTableHelper('traffic_fines'),
};

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
