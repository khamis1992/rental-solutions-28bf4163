
/**
 * Common database-related types and constants used across the application
 */

/**
 * Type for database ID to ensure consistent ID handling
 */
export type DbId = string;

/**
 * Lease/Agreement status values
 */
export type LeaseStatus = 
  | 'active' 
  | 'pending' 
  | 'pending_payment' 
  | 'pending_deposit'
  | 'draft' 
  | 'cancelled' 
  | 'completed' 
  | 'terminated' 
  | 'closed'
  | 'archived'
  | 'expired';

/**
 * Vehicle status values
 */
export type VehicleStatus =
  | 'available'
  | 'rented'
  | 'maintenance'
  | 'reserved'
  | 'sold'
  | 'damaged'
  | 'inactive';

/**
 * Payment status values
 */
export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'partially_paid'
  | 'overdue'
  | 'cancelled'
  | 'refunded'
  | 'processing';

/**
 * Traffic fine payment status values
 */
export type TrafficFinePaymentStatus =
  | 'pending'
  | 'paid'
  | 'disputed'
  | 'refunded';

/**
 * Generic entity status type for backwards compatibility
 */
export type EntityStatus = string;

/**
 * Type-safe ID casting functions for specific entities
 */
export function asLeaseId(id: string): DbId {
  return id as DbId;
}

export function asVehicleId(id: string): DbId {
  return id as DbId;
}

export function asProfileId(id: string): DbId {
  return id as DbId;
}

export function asPaymentId(id: string): DbId {
  return id as DbId;
}

export function asTrafficFineId(id: string): DbId {
  return id as DbId;
}

export function asMaintenanceId(id: string): DbId {
  return id as DbId;
}

/**
 * Type-safe status casting functions
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

export function asTrafficFinePaymentStatus(status: string): TrafficFinePaymentStatus {
  return status as TrafficFinePaymentStatus;
}

export function asEntityStatus(status: string): EntityStatus {
  return status as EntityStatus;
}

/**
 * Column utilities
 */
export function asTableColumn(tableName: string, columnName: string): string {
  return columnName;
}

/**
 * Constants for status values used in the application
 */
export const LEASE_STATUSES = {
  ACTIVE: 'active',
  PENDING: 'pending',
  PENDING_PAYMENT: 'pending_payment',
  PENDING_DEPOSIT: 'pending_deposit',
  DRAFT: 'draft',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  TERMINATED: 'terminated',
  CLOSED: 'closed',
  ARCHIVED: 'archived',
  EXPIRED: 'expired'
} as const;

export const VEHICLE_STATUSES = {
  AVAILABLE: 'available',
  RENTED: 'rented',
  MAINTENANCE: 'maintenance',
  RESERVED: 'reserved',
  SOLD: 'sold',
  DAMAGED: 'damaged',
  INACTIVE: 'inactive'
} as const;

export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  PARTIALLY_PAID: 'partially_paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  PROCESSING: 'processing'
} as const;

export const TRAFFIC_FINE_PAYMENT_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  DISPUTED: 'disputed',
  REFUNDED: 'refunded'
} as const;
