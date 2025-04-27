
/**
 * Utility for casting string IDs to the correct database ID types
 * This helps bridge the gap between our application's string IDs and Supabase's type system
 */

import { Database } from '@/types/database.types';

/**
 * Cast a string ID to a specific table's ID type
 */
export function asTableId(id: string): string {
  return id;
}

/**
 * Cast a string ID to agreement_id type
 */
export function asAgreementId(id: string): string {
  return id;
}

/**
 * Cast a string ID to lease_id type
 */
export function asLeaseId(id: string): string {
  return id;
}

/**
 * Cast a string ID to import_id type
 */
export function asImportId(id: string): string {
  return id;
}

/**
 * Cast a string ID to payment_id type
 */
export function asPaymentId(id: string): string {
  return id;
}

/**
 * Cast a string ID to traffic_fine_id type
 */
export function asTrafficFineId(id: string): string {
  return id;
}

/**
 * Cast a status string to a specific status type
 */
export function asLeaseStatus(status: string): string {
  return status;
}

/**
 * Cast a status string to payment status type
 */
export function asPaymentStatus(status: string): string {
  return status;
}

/**
 * Cast a database ID for type safety with Supabase
 * @deprecated Use castDbId from database-type-helpers.ts instead
 */
export function castDbId(id: string): string {
  return id;
}

/**
 * Type safe conversion for UUIDs
 */
export function asUUID(id: string): string {
  return id;
}
