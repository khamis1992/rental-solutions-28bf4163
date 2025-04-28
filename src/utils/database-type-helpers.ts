
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
} from '@/types/database-common';

// Define a UUID type for backward compatibility
export type uuid = string;

// Function to properly handle AgreementForm requirements
export function asAgreementStatusColumn(status: string): string {
  return asLeaseStatus(status);
}

// Function to properly handle Vehicle status
export function asVehicleStatusColumn(status: string): string {
  return asVehicleStatus(status);
}

// Function to properly handle Payment status
export function asPaymentStatusColumn(status: string): string {
  return asPaymentStatus(status);
}

// Legacy functions with corrected implementations
export function asStatusColumn<T extends keyof Database['public']['Tables']>(
  status: string,
  _table?: T,
  _column?: string
): string {
  return asEntityStatus(status);
}

// Add helpers for backward compatibility
export function hasData<T>(
  response: any
): response is { data: T; error: null } {
  return !response?.error && response?.data !== null;
}
