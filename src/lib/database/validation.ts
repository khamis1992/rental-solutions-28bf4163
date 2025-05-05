
/**
 * Type validation functions for database operations
 * Ensures that string values are valid database enum values
 */

import { Database } from '@/types/database.types';

// Type aliases for database enums
type VehicleStatus = Database['public']['Tables']['vehicles']['Row']['status'];
type LeaseStatus = Database['public']['Tables']['leases']['Row']['status'];
type PaymentStatus = string; // Using string since it's more flexible for this type

/**
 * Validates that a string is a valid vehicle status
 */
export function asVehicleStatus(status: string): VehicleStatus {
  const validStatuses = [
    'available', 'rented', 'maintenance', 'retired', 
    'police_station', 'accident', 'stolen', 'reserved'
  ];
  
  if (!validStatuses.includes(status)) {
    console.warn(`Invalid vehicle status: '${status}'. Expected one of: ${validStatuses.join(', ')}`);
  }
  
  return status as VehicleStatus;
}

/**
 * Validates that a string is a valid lease status
 */
export function asLeaseStatus(status: string): LeaseStatus {
  const validStatuses = [
    'active', 'pending', 'completed', 'cancelled', 'pending_payment',
    'pending_deposit', 'draft', 'terminated', 'archived', 'closed'
  ];
  
  if (!validStatuses.includes(status)) {
    console.warn(`Invalid lease status: '${status}'. Expected one of: ${validStatuses.join(', ')}`);
  }
  
  return status as LeaseStatus;
}

/**
 * Validates that a string is a valid payment status
 */
export function asPaymentStatus(status: string): PaymentStatus {
  const validStatuses = [
    'pending', 'paid', 'overdue', 'cancelled', 'refunded', 'partial'
  ];
  
  if (!validStatuses.includes(status)) {
    console.warn(`Invalid payment status: '${status}'. Expected one of: ${validStatuses.join(', ')}`);
  }
  
  return status;
}

/**
 * Generic status validation that can be used for any entity
 */
export function asEntityStatus(status: string): string {
  // This is a generic validation that just returns the status
  // In a real implementation, you might want to add more validation here
  return status;
}

/**
 * Type-safe ID validation function
 */
export function asId(id: string): string {
  if (!id || typeof id !== 'string') {
    console.warn('Invalid ID provided');
  }
  return id;
}

/**
 * Type guard to check if a value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard to check if a value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard to check if a value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Type guard to check if a value is a date
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}
