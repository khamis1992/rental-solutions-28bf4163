
/**
 * Utility functions for type casting database IDs to their specific types
 */

// Common ID types
export type UUID = string;
export type LeaseId = UUID;
export type VehicleId = UUID;
export type ProfileId = UUID;
export type PaymentId = UUID;
export type TrafficFineId = UUID;
export type LegalCaseId = UUID;
export type MaintenanceId = UUID;

/**
 * Type-safe ID conversion functions
 */
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

/**
 * Generic status casting function
 */
export function asStatus<T extends string>(status: string, _type?: T): T {
  return status as T;
}
