
// Re-export everything from the new database layer
export * from '@/lib/database';

// Legacy exports for backward compatibility
import { Database } from "@/types/database.types";
import { asTableId, asTableColumn } from '@/lib/database/utils';

// Define a UUID type for backward compatibility
export type uuid = string;

// Re-export essential functions
export { 
  asLeaseId, 
  asVehicleId,
  asProfileId,
  asPaymentId,
  asTrafficFineId,
  asMaintenanceId,
  asLeaseStatus,
  asPaymentStatus,
  asVehicleStatus,
  asProfileStatus,
  asMaintenanceStatus,
} from '@/lib/database';

// Special compatibility columns for backward compatibility
export { 
  asLeaseIdColumn,
  asVehicleIdColumn,
  asProfileIdColumn,
  asPaymentIdColumn,
  asTrafficFineIdColumn,
  asMaintenanceIdColumn,
  castLeaseUpdate,
  castRowData
} from '@/lib/database';

// Legacy functions with corrected implementations
export function asStatusColumn<T extends keyof Database['public']['Tables']>(
  status: string,
  _table: T,
  _column: keyof Database['public']['Tables'][T]['Row'] & string
): string {
  return status;
}

// Add helpers for backward compatibility
export function hasData<T>(
  response: any
): response is { data: T; error: null } {
  return !response?.error && response?.data !== null;
}

// Function to properly handle AgreementForm requirements
export function asAgreementStatusColumn(status: string): string {
  return status;
}

// Function to properly handle Vehicle status
export function asVehicleStatusColumn(status: string): string {
  return status;
}

// Function to properly handle Payment status
export function asPaymentStatusColumn(status: string): string {
  return status;
}
