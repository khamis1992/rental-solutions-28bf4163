
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/postgrest-js';

/**
 * Helper function to handle lease ID column
 * Used to convert ID strings to a format accepted by Supabase
 */
export const asLeaseIdColumn = (id: string): string => {
  return id;
};

/**
 * Helper function to handle payment ID column
 * Used to convert ID strings to a format accepted by Supabase
 */
export const asPaymentId = (id: string): string => {
  return id;
};

/**
 * Helper function to handle agreement ID column
 * Used to convert ID strings to a format accepted by Supabase
 */
export const asAgreementIdColumn = (id: string): string => {
  return id;
};

/**
 * Helper function to handle import ID column
 * Used to convert ID strings to a format accepted by Supabase
 */
export const asImportIdColumn = (id: string): string => {
  return id;
};

/**
 * Helper function to handle traffic fine ID column
 * Used to convert ID strings to a format accepted by Supabase
 */
export const asTrafficFineIdColumn = (id: string): string => {
  return id;
};

/**
 * Helper function to handle vehicle ID column
 * Used to convert ID strings to a format accepted by Supabase
 */
export const asVehicleIdColumn = (id: string): string => {
  return id;
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
export const asPaymentStatusColumn = (status: string): string => {
  return status;
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
