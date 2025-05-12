
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

// Re-export these types directly from the lease-types module to avoid import issues
export { 
  type LeaseStatus, 
  type ValidationLeaseStatus, 
  toValidationLeaseStatus,
  ensureValidLeaseStatus,
  ensureValidationLeaseStatus 
} from '../types/lease-types';
