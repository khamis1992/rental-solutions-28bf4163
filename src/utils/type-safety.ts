
import { Database } from '@/types/database.types';
import { LeaseStatus as LeaseStatusType } from '@/types/lease-types';
import { toValidationLeaseStatus } from '@/types/lease-types';

// Helper type for database ID type casting
export type DbId = string;

/**
 * Type-safe function to cast a string to a vehicle ID
 */
export function asVehicleId(id: string | null | undefined): string | undefined {
  return id ?? undefined;
}

/**
 * Type-safe function to cast a string to an agreement/lease ID
 */
export function asLeaseId(id: string | null | undefined): string | undefined {
  return id ?? undefined;
}

/**
 * Type-safe function to cast a string to a maintenance ID
 */
export function asMaintenanceId(id: string | null | undefined): string | undefined {
  return id ?? undefined;
}

/**
 * Type-safe function to cast a string to a payment ID
 */
export function asPaymentId(id: string | null | undefined): string | undefined {
  return id ?? undefined;
}

/**
 * Type-safe function to check if an object exists and has a property
 */
export function hasProperty<T extends object, K extends string>(
  obj: T | null | undefined, 
  prop: K
): obj is T & Record<K, unknown> {
  return obj !== null && obj !== undefined && prop in obj;
}

/**
 * Type guard to check if a response has data and is not an error
 */
export function isNotError<T>(obj: any): obj is T {
  return obj && typeof obj === 'object' && !('error' in obj) && obj !== null;
}

/**
 * Safely get a property from an object with a default value
 */
export function safeGet<T, K extends keyof T>(
  obj: T | null | undefined, 
  key: K, 
  defaultValue?: T[K]
): T[K] | undefined {
  if (!obj) return defaultValue;
  return obj[key] ?? defaultValue;
}

/**
 * Cast a lease status to a validation-compatible status
 */
export function ensureValidLeaseStatus(status: LeaseStatusType | string | null | undefined): string {
  if (!status) return 'draft';
  return toValidationLeaseStatus(status as LeaseStatusType);
}
