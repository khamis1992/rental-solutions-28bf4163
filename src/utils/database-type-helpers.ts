
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

