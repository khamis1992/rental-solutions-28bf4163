
import { Database } from '@/types/database.types';

// Helper type for easy table access
export type Tables = Database['public']['Tables'];

// Export commonly used table types
export type LeaseRow = Tables['leases']['Row'];
export type PaymentRow = Tables['unified_payments']['Row'];
export type VehicleRow = Tables['vehicles']['Row'];
export type ProfileRow = Tables['profiles']['Row'];
export type TrafficFineRow = Tables['traffic_fines']['Row'];

// Common status types
export type VehicleStatus = VehicleRow['status']; 
export type LeaseStatus = LeaseRow['status'];
export type PaymentStatus = PaymentRow['status']; 

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

/**
 * Type-safe ID conversion functions
 */
export function asLeaseId(id: string): string {
  return id;
}

export function asVehicleId(id: string): string {
  return id;
}

export function asProfileId(id: string): string {
  return id;
}

export function asPaymentId(id: string): string {
  return id;
}

export function asTrafficFineId(id: string): string {
  return id;
}

export function asMaintenanceId(id: string): string {
  return id;
}

/**
 * Type guard for table rows
 */
export function isLeaseRow(obj: any): obj is LeaseRow {
  return obj && typeof obj.id === 'string';
}

export function isVehicleRow(obj: any): obj is VehicleRow {
  return obj && typeof obj.id === 'string' && typeof obj.license_plate === 'string';
}

export function isPaymentRow(obj: any): obj is PaymentRow {
  return obj && typeof obj.id === 'string' && typeof obj.amount === 'number';
}

export function isProfileRow(obj: any): obj is ProfileRow {
  return obj && typeof obj.id === 'string' && typeof obj.email === 'string';
}
