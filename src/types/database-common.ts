
import { Database } from '@/types/database.types';

// Core database types with consistent naming
export type DatabaseSchema = Database['public'];
export type DatabaseTables = DatabaseSchema['Tables'];

// Standardized ID types
export type DbId = string;
export type LeaseId = DbId;
export type VehicleId = DbId;
export type ProfileId = DbId;
export type PaymentId = DbId;
export type TrafficFineId = DbId;
export type LegalCaseId = DbId;
export type MaintenanceId = DbId;
export type AgreementId = LeaseId; // Maintaining legacy compatibility

// Standardized status types from database schema
export type LeaseStatus = DatabaseTables['leases']['Row']['status'];
export type VehicleStatus = DatabaseTables['vehicles']['Row']['status'];
export type PaymentStatus = string; // Using string since it could have different values
export type ProfileStatus = string;
export type MaintenanceStatus = string;

// Standard row types with consistent naming
export type LeaseRow = DatabaseTables['leases']['Row'];
export type VehicleRow = DatabaseTables['vehicles']['Row'];
export type ProfileRow = DatabaseTables['profiles']['Row'];
export type PaymentRow = DatabaseTables['unified_payments']['Row'];
export type TrafficFineRow = DatabaseTables['traffic_fines']['Row'];
export type LegalCaseRow = DatabaseTables['legal_cases']['Row']; 

// Standardized insert/update types
export type LeaseInsert = DatabaseTables['leases']['Insert'];
export type LeaseUpdate = DatabaseTables['leases']['Update'];
export type VehicleInsert = DatabaseTables['vehicles']['Insert'];
export type VehicleUpdate = DatabaseTables['vehicles']['Update'];
export type PaymentInsert = DatabaseTables['unified_payments']['Insert'];
export type PaymentUpdate = DatabaseTables['unified_payments']['Update'];

// Type-safe casting functions with consistent naming
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

export function asMaintenanceId(id: string): MaintenanceId {
  return id as MaintenanceId;
}

// Status casting functions with consistent naming
export function asLeaseStatus(status: string): LeaseStatus {
  return status as LeaseStatus;
}

export function asVehicleStatus(status: string): VehicleStatus {
  return status as VehicleStatus;
}

export function asPaymentStatus(status: string): PaymentStatus {
  return status as PaymentStatus;
}

export function asProfileStatus(status: string): ProfileStatus {
  return status as ProfileStatus;
}

export function asMaintenanceStatus(status: string): MaintenanceStatus {
  return status as MaintenanceStatus;
}

// Generic entity functions with consistent naming
export function asEntityId<T extends DbId>(id: string): T {
  return id as T;
}

export function asEntityStatus<T extends string>(status: string): T {
  return status as T;
}

// Standardized response type names
export type DatabaseResponse<T> = {
  data: T | null;
  error: Error | null;
};

export type ListResponse<T> = DatabaseResponse<T[]>;
export type SingleResponse<T> = DatabaseResponse<T>;

// Helper type guards with consistent naming
export function isSuccessResponse<T>(response: any): response is { data: T; error: null } {
  return !response?.error && response?.data !== null;
}

export function hasEntityData<T>(response: any): response is { data: T; error: null } {
  return !response?.error && response?.data !== null;
}
