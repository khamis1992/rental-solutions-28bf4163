import { 
  isErrorResponse as isStandardErrorResponse,
  isAppError as isStandardAppError,
  AppError
} from '@/types/error.types';
import { PostgrestError } from '@supabase/supabase-js';

// Re-export standardized type guards
export const isErrorResponse = isStandardErrorResponse;
export const isAppError = isStandardAppError;

/**
 * Type guard to check if a value is not an error
 */
export function isNotError(value: unknown): value is Exclude<unknown, Error | AppError | PostgrestError | string> {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return false;
  if (value instanceof Error) return false;
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    if ('code' in obj && 'message' in obj) return false; // AppError or PostgrestError
  }
  return true;
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

// Re-export these types directly from the lease-types module to avoid import issues
export { 
  type LeaseStatus, 
  type ValidationLeaseStatus, 
  toValidationLeaseStatus,
  ensureValidLeaseStatus,
  ensureValidationLeaseStatus 
} from '../types/lease-types';
