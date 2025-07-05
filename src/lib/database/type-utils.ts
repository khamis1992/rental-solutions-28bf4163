import { Database } from '@/types/database.types';
import { VehicleStatus } from '@/types/database.types';
import { isValidVehicleStatus as validateVehicleStatus } from '@/lib/validation/vehicle-status';

// Only include table names that exist in the actual database schema
export type AvailableTableName = keyof Database['public']['Tables'];

// ID types for type safety
export type LeaseId = string;
export type ProfileId = string; 
export type VehicleId = string;
export type PaymentId = string;

// Type-safe ID casting functions for existing tables only
export function asLeaseId(id: string): LeaseId {
  return id as LeaseId;
}

export function asProfileId(id: string): ProfileId {
  return id as ProfileId;
}

export function asVehicleId(id: string): VehicleId {
  return id as VehicleId;
}

export function asPaymentId(id: string): PaymentId {
  return id as PaymentId;
}

export function asLeaseStatus(status: string): 'active' | 'closed' | 'cancelled' | 'draft' | 'pending' | 'expired' {
  return status as 'active' | 'closed' | 'cancelled' | 'draft' | 'pending' | 'expired';
}

export function asPaymentStatus(status: string): 'pending' | 'completed' | 'overdue' | 'cancelled' {
  return status as 'pending' | 'completed' | 'overdue' | 'cancelled';
}

export function asTrafficFineStatus(status: string): string {
  return status;
}

// Generic helper for table access
export function getTableRow<T extends AvailableTableName>(
  tableName: T
): Database['public']['Tables'][T]['Row'] {
  // This is a type helper function, implementation would depend on actual usage
  throw new Error(`Table ${tableName} access not implemented`);
}

// Status validation helpers
export function isValidLeaseStatus(status: string): status is 'active' | 'closed' | 'cancelled' | 'draft' | 'pending' | 'expired' {
  return ['active', 'closed', 'cancelled', 'draft', 'pending', 'expired'].includes(status);
}

// Re-export the centralized vehicle status validation
export { validateVehicleStatus as isValidVehicleStatus };

export function isValidPaymentStatus(status: string): status is 'pending' | 'completed' | 'overdue' | 'cancelled' {
  return ['pending', 'completed', 'overdue', 'cancelled'].includes(status);
}
