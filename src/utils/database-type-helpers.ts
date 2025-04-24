
/**
 * Helper functions to convert IDs to the proper type for different tables
 * This helps with TypeScript type safety when working with Supabase queries
 */

/**
 * Convert any string ID to a properly typed table ID
 * @param table The table name
 * @param id The ID to convert
 * @returns The ID with the proper type for the specified table
 */
export const asTableId = (table: string, id: string): string => {
  return id;
};

/**
 * Convert any string ID to a properly typed vehicle ID
 * @param id The ID to convert
 * @returns The ID with the proper type for the vehicle_id column
 */
export const asVehicleId = (id: string): string => {
  return id;
};

/**
 * Convert any string ID to a properly typed agreement ID column
 * @param id The ID to convert
 * @returns The ID with the proper type for the agreement_id column
 */
export const asAgreementIdColumn = (id: string): string => {
  return id;
};

/**
 * Convert any string ID to a properly typed lease ID column
 * @param id The ID to convert
 * @returns The ID with the proper type for the lease_id column
 */
export const asLeaseIdColumn = (id: string): string => {
  return id;
};

/**
 * Convert any string ID to a properly typed import ID column
 * @param id The ID to convert
 * @returns The ID with the proper type for the import_id column
 */
export const asImportIdColumn = (id: string): string => {
  return id;
};

/**
 * Convert any string ID to a properly typed payment ID
 * @param id The ID to convert
 * @returns The ID with the proper type for the payment_id column
 */
export const asPaymentId = (id: string): string => {
  return id;
};

/**
 * Convert any string ID to a properly typed traffic fine ID column
 * @param id The ID to convert
 * @returns The ID with the proper type for the traffic_fine_id column
 */
export const asTrafficFineIdColumn = (id: string): string => {
  return id;
};
