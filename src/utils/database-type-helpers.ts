
/**
 * Helper functions for managing typesafe Supabase operations
 */

import { Database } from '@/types/database.types';

// Type aliases for commonly used types
type Tables = Database['public']['Tables'];

// Cast a string to a vehicle ID type for Supabase operations
export function asVehicleId(id: string): Tables['vehicles']['Row']['id'] {
  return id as Tables['vehicles']['Row']['id'];
}

// Cast a string to a vehicle status type for Supabase operations
export function asVehicleStatus(status: string): Tables['vehicles']['Row']['status'] {
  return status as Tables['vehicles']['Row']['status'];
}

// Cast a string to a agreement/lease ID type for Supabase operations
export function asAgreementId(id: string): Tables['leases']['Row']['id'] {
  return id as Tables['leases']['Row']['id'];
}

// Cast a string to a customer ID type for Supabase operations
export function asCustomerId(id: string): Tables['profiles']['Row']['id'] {
  return id as Tables['profiles']['Row']['id'];
}

// Cast a string to a payment ID type for Supabase operations
export function asPaymentId(id: string): Tables['unified_payments']['Row']['id'] {
  return id as Tables['unified_payments']['Row']['id'];
}

// Cast a string to a maintenance ID type for Supabase operations
export function asMaintenanceId(id: string): Tables['maintenance']['Row']['id'] {
  return id as Tables['maintenance']['Row']['id'];
}

/**
 * Type guard to check if an object is not null and has expected properties
 */
export function hasProperty<T, K extends keyof T>(obj: T | null | undefined, prop: K): obj is T {
  return obj !== null && obj !== undefined && prop in obj;
}

/**
 * Type guard to check if a response has data (not an error)
 */
export function hasData<T>(response: any): response is { data: T; error: null } {
  return response && !response.error && response.data !== null;
}

/**
 * Safe way to access nested properties in potentially undefined objects
 */
export function safeGet<T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined {
  if (obj == null) return undefined;
  return obj[key];
}
