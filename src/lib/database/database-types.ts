
import { Tables } from './types';

/**
 * Common ID types
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
