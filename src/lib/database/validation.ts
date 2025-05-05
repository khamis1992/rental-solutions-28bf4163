
import { Tables, VehicleStatus, LeaseStatus, PaymentStatus, ProfileStatus } from './types';

// Type-safe validation for vehicle status
export function asVehicleStatus(status: string): VehicleStatus {
  const validStatuses = ['available', 'rented', 'reserved', 'maintenance', 'police_station', 'accident', 'stolen', 'retired'];
  if (!validStatuses.includes(status)) {
    console.warn(`Invalid vehicle status: '${status}'. Expected one of: ${validStatuses.join(', ')}`);
  }
  return status as VehicleStatus;
}

// Type-safe validation for lease status
export function asLeaseStatus(status: string): LeaseStatus {
  const validStatuses = ['active', 'pending', 'completed', 'cancelled', 'pending_payment', 'pending_deposit', 'draft', 'terminated', 'archived', 'closed'];
  if (!validStatuses.includes(status)) {
    console.warn(`Invalid lease status: '${status}'. Expected one of: ${validStatuses.join(', ')}`);
  }
  return status as LeaseStatus;
}

// Type-safe validation for payment status
export function asPaymentStatus(status: string): PaymentStatus {
  const validStatuses = ['pending', 'completed', 'cancelled', 'failed', 'refunded', 'overdue'];
  if (!validStatuses.includes(status)) {
    console.warn(`Invalid payment status: '${status}'. Expected one of: ${validStatuses.join(', ')}`);
  }
  return status as PaymentStatus;
}

// Type-safe validation for profile status
export function asProfileStatus(status: string): ProfileStatus {
  const validStatuses = ['active', 'inactive', 'pending_review', 'blocked', 'archived'];
  if (!validStatuses.includes(status)) {
    console.warn(`Invalid profile status: '${status}'. Expected one of: ${validStatuses.join(', ')}`);
  }
  return status as ProfileStatus;
}

// Generic type validator
export function isOfType<T>(value: unknown, validator: (val: unknown) => boolean): value is T {
  return validator(value);
}

// Type guards for common types
export const typeGuards = {
  isString: (value: unknown): value is string => typeof value === 'string',
  isNumber: (value: unknown): value is number => typeof value === 'number' && !isNaN(value),
  isBoolean: (value: unknown): value is boolean => typeof value === 'boolean',
  isDate: (value: unknown): value is Date => value instanceof Date && !isNaN(value.getTime()),
  isObject: (value: unknown): value is Record<string, unknown> => 
    typeof value === 'object' && value !== null && !Array.isArray(value),
  isArray: <T>(value: unknown, itemGuard?: (item: unknown) => item is T): value is T[] => {
    if (!Array.isArray(value)) return false;
    if (itemGuard) return value.every(itemGuard);
    return true;
  }
};

// Type-safe database ID validation
export function isValidDatabaseId(id: unknown): boolean {
  if (!typeGuards.isString(id)) return false;
  
  // Basic UUID format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Type assertion function with runtime check
export function assertType<T>(value: unknown, guard: (val: unknown) => boolean): T {
  if (!guard(value)) {
    throw new TypeError(`Type assertion failed: ${value} did not match expected type`);
  }
  return value as T;
}

// Validate object shape against expected schema
export function validateObjectShape<T extends Record<string, unknown>>(
  obj: unknown, 
  schema: Record<keyof T, (val: unknown) => boolean>
): obj is T {
  if (!typeGuards.isObject(obj)) return false;
  
  return Object.entries(schema).every(([key, validator]) => {
    return key in obj && validator(obj[key as keyof typeof obj]);
  });
}
