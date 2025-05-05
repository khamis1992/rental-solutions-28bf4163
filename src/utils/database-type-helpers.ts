
/**
 * Database type helper utilities
 * Provides type conversion and validation functions for database operations
 */

// Re-export everything from the new database layer
export * from '@/lib/database';
export * from '@/types/database-types';
export * from '@/types/database-common'; // Add the new common types

// Legacy exports for backward compatibility
import { Database } from "@/types/database.types";
import { asTableId, asTableColumn } from '@/lib/database/utils';
import { 
  asLeaseStatus, 
  asVehicleStatus, 
  asPaymentStatus,
  asEntityStatus
} from '@/lib/database/validation';

// Define a UUID type for backward compatibility
export type uuid = string;

/**
 * Validates and converts agreement status to database-compatible format
 * @param status - Agreement status string
 * @returns Validated agreement status
 */
export function asAgreementStatusColumn(status: string): string {
  return asLeaseStatus(status);
}

/**
 * Validates and converts vehicle status to database-compatible format
 * @param status - Vehicle status string
 * @returns Validated vehicle status
 */
export function asVehicleStatusColumn(status: string): string {
  return asVehicleStatus(status);
}

/**
 * Validates and converts payment status to database-compatible format
 * @param status - Payment status string
 * @returns Validated payment status
 */
export function asPaymentStatusColumn(status: string): string {
  return asPaymentStatus(status);
}

/**
 * Generic status column converter for database entities
 * @param status - Entity status string
 * @param _table - Optional table name
 * @param _column - Optional column name
 * @returns Validated status string
 */
export function asStatusColumn<T extends keyof Database['public']['Tables']>(
  status: string,
  _table?: T,
  _column?: string
): string {
  return asEntityStatus(status);
}

/**
 * Type guard for checking if database response contains data
 * @param response - Database query response
 * @returns Type predicate indicating if response has data
 */
export function hasData<T>(
  response: any
): response is { data: T; error: null } {
  return !response?.error && response?.data !== null;
}

// Add missing asVehicleId function
export function asVehicleId(id: string): string {
  return asTableId('vehicles', id);
}
