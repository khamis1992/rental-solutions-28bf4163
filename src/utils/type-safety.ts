
import { LeaseStatus, ValidationLeaseStatus, toValidationLeaseStatus } from '@/types/lease-types';

/**
 * Type guard to check if a value is not an error
 */
export function isNotError(value: any): boolean {
  return value !== null && 
         value !== undefined && 
         typeof value !== 'string' && 
         !('error' in value);
}

/**
 * Type guard to check if an object has a property
 */
export function hasProperty<T extends object, K extends string>(
  obj: T | null | undefined,
  key: K
): obj is T & Record<K, unknown> {
  return obj !== null && obj !== undefined && key in obj;
}

/**
 * Safely get a value from an object, handle nullish values
 */
export function safeGet<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K
): T[K] | undefined {
  if (obj === null || obj === undefined) return undefined;
  return obj[key];
}

/**
 * Cast string to LeaseId with type safety
 */
export function asLeaseId(id: string | null | undefined): string {
  return id || '';
}

/**
 * Cast string to PaymentId with type safety
 */
export function asPaymentId(id: string | null | undefined): string {
  return id || '';
}

/**
 * Cast string to VehicleId with type safety
 */
export function asVehicleId(id: string | null | undefined): string {
  return id || '';
}

/**
 * Cast string to MaintenanceId with type safety
 */
export function asMaintenanceId(id: string | null | undefined): string {
  return id || '';
}

/**
 * Ensures a lease status is valid, defaulting to 'draft' if not
 */
export function ensureValidLeaseStatus(status: any): LeaseStatus {
  if (!status) return 'draft';
  
  const validStatuses: LeaseStatus[] = [
    'active',
    'pending',
    'completed',
    'cancelled',
    'pending_payment',
    'pending_deposit',
    'draft',
    'terminated',
    'archived',
    'closed',
    'expired'
  ];
  
  return validStatuses.includes(status as LeaseStatus) 
    ? (status as LeaseStatus) 
    : 'draft';
}

/**
 * Convert any lease status to a validation-compatible status
 */
export function ensureValidationLeaseStatus(status: string | null | undefined): ValidationLeaseStatus {
  if (!status) return 'draft';
  return toValidationLeaseStatus(status as LeaseStatus);
}
