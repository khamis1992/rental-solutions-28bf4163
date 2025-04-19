
import { Database } from './database.types';

export type DbTables = Database['public']['Tables'];
export type SchemaName = keyof Database;

// ID Types 
export type LeaseId = DbTables['leases']['Row']['id'];
export type PaymentId = DbTables['unified_payments']['Row']['id'];
export type AgreementId = DbTables['leases']['Row']['id'];
export type VehicleId = DbTables['vehicles']['Row']['id'];
export type CustomerId = DbTables['profiles']['Row']['id'];
export type ImportId = string;

// Status Types
export type LeaseStatus = DbTables['leases']['Row']['status'];
export type PaymentStatus = DbTables['unified_payments']['Row']['status'];
export type VehicleStatus = DbTables['vehicles']['Row']['status'];

// Helper function for type casting
export function asDbId<T>(id: string): T {
  return id as T;
}

// Import UUID type from database-type-helpers
export type UUID = string;

// Type assertion helper functions that are safe for Supabase queries
export function asLeaseId(id: UUID): UUID {
  return id;
}

export function asPaymentId(id: UUID): UUID {
  return id;
}

export function asAgreementId(id: UUID): UUID {
  return id; 
}

export function asImportId(id: UUID): UUID {
  return id;
}

export function asTrafficFineId(id: UUID): UUID {
  return id;
}

export function asVehicleId(id: UUID): UUID {
  return id;
}

export function asCustomerId(id: UUID): UUID {
  return id;
}

export function asProfileId(id: UUID): UUID {
  return id;
}

export function asLegalCaseId(id: UUID): UUID {
  return id;
}

// Column helper functions
export function asTrafficFineIdColumn(id: UUID): UUID {
  return id;
}

export function asLeaseIdColumn(id: UUID): UUID {
  return id;
}

export function asAgreementIdColumn(id: UUID): UUID {
  return id;
}

export function asImportIdColumn(id: UUID): UUID {
  return id;
}

export function asCustomerIdColumn(id: UUID): UUID {
  return id;
}

// Helper function to safely extract data from Supabase queries
export function hasData<T>(
  response: { data: T | null; error: any } | null | undefined
): response is { data: T; error: null } {
  return !!response && !response.error && response.data !== null;
}

export function safelyExtractData<T>(response: { data: T | null; error: any } | null | undefined): T | null {
  if (!response || response.error || !response.data) {
    return null;
  }
  return response.data;
}
