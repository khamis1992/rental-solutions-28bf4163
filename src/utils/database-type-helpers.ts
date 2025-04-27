
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/postgrest-js';
import { Database } from '@/types/database.types';

type Tables = Database['public']['Tables'];
type TableNames = keyof Tables;
type RowType<T extends TableNames> = Tables[T]['Row'];
type StatusType<T extends TableNames> = Tables[T]['Row']['status'];

/**
 * Helper function to handle lease ID column
 */
export const asLeaseIdColumn = (id: string): RowType<'leases'>['id'] => {
  return id as RowType<'leases'>['id'];
};

/**
 * Helper function to handle payment ID column
 */
export const asPaymentId = (id: string): RowType<'unified_payments'>['id'] => {
  return id as RowType<'unified_payments'>['id'];
};

/**
 * Helper function to handle agreement ID column
 */
export const asAgreementIdColumn = (id: string): RowType<'leases'>['id'] => {
  return id as RowType<'leases'>['id'];
};

/**
 * Helper function to handle import ID column
 */
export const asImportIdColumn = (id: string): RowType<'agreement_imports'>['id'] => {
  return id as RowType<'agreement_imports'>['id'];
};

/**
 * Helper function to handle traffic fine ID column
 */
export const asTrafficFineIdColumn = (id: string): RowType<'traffic_fines'>['id'] => {
  return id as RowType<'traffic_fines'>['id'];
};

/**
 * Helper for status columns
 */
export const asStatusColumn = (status: string): string => {
  return status;
};

/**
 * Helper for payment status columns
 */
export const asPaymentStatusColumn = (status: string): RowType<'unified_payments'>['status'] => {
  return status as RowType<'unified_payments'>['status'];
};

/**
 * Helper for vehicle ID column
 */
export const asVehicleIdColumn = (id: string): RowType<'vehicles'>['id'] => {
  return id as RowType<'vehicles'>['id'];
};

/**
 * Helper for vehicle ID filtering
 */
export const asVehicleFilter = (id: string): RowType<'leases'>['vehicle_id'] => {
  return id as RowType<'leases'>['vehicle_id'];
};

/**
 * Safely extract data from a PostgrestResponse
 */
export const safelyExtractData = <T>(response: PostgrestResponse<T> | PostgrestSingleResponse<T>): T[] | null => {
  if (response.error) {
    console.error('Error in database response:', response.error);
    return null;
  }
  return Array.isArray(response.data) ? response.data : (response.data ? [response.data] : []);
};

/**
 * Type guard to check if a response has data
 */
export function hasData<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T>
): response is { data: NonNullable<T>; error: null } {
  return !response.error && response.data !== null;
}

/**
 * Re-export functions from database-helpers for backward compatibility
 */
export { 
  asTableId, 
  asVehicleId,
  asLeaseId,
  asTrafficFineId,
  asImportId,
  asCustomerId
} from '@/lib/database-helpers';

