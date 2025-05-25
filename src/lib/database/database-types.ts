
import { Tables } from './types';
import { isValidUUID, validateUUID } from '../uuid-validation';

/**
 * Common ID types with validation
 */
export type UUID = string;
export type LeaseId = UUID;
export type VehicleId = UUID;
export type ProfileId = UUID;
export type PaymentId = UUID;
export type TrafficFineId = UUID;
export type LegalCaseId = UUID;
export type MaintenanceId = UUID;

/**
 * Status types
 */
export type LeaseStatus = Tables['leases']['Row']['status'];
export type VehicleStatus = Tables['vehicles']['Row']['status'];
export type PaymentStatus = Tables['unified_payments']['Row']['status'];
export type TrafficFineStatus = Tables['traffic_fines']['Row']['payment_status'];

/**
 * DB Row types
 */
export type LeaseRow = Tables['leases']['Row'];
export type VehicleRow = Tables['vehicles']['Row'];
export type ProfileRow = Tables['profiles']['Row'];
export type PaymentRow = Tables['unified_payments']['Row'];
export type TrafficFineRow = Tables['traffic_fines']['Row'];
export type LegalCaseRow = Tables['legal_cases']['Row'];

/**
 * Type-safe ID conversion functions with validation
 */
export function asLeaseId(id: string | undefined | null): LeaseId {
  return validateUUID(id, 'LeaseId');
}

export function asVehicleId(id: string | undefined | null): VehicleId {
  return validateUUID(id, 'VehicleId');
}

export function asProfileId(id: string | undefined | null): ProfileId {
  return validateUUID(id, 'ProfileId');
}

export function asPaymentId(id: string | undefined | null): PaymentId {
  return validateUUID(id, 'PaymentId');
}

export function asTrafficFineId(id: string | undefined | null): TrafficFineId {
  return validateUUID(id, 'TrafficFineId');
}

export function asLegalCaseId(id: string | undefined | null): LegalCaseId {
  return validateUUID(id, 'LegalCaseId');
}

export function asMaintenanceId(id: string | undefined | null): MaintenanceId {
  return validateUUID(id, 'MaintenanceId');
}

/**
 * Type-safe status conversion functions
 */
export function asLeaseStatus(status: string): LeaseStatus {
  return status as LeaseStatus;
}

export function asVehicleStatus(status: string): VehicleStatus {
  return status as VehicleStatus;
}

export function asPaymentStatus(status: string): PaymentStatus {
  return status as PaymentStatus;
}

export function asTrafficFineStatus(status: string): TrafficFineStatus {
  return status as TrafficFineStatus;
}
