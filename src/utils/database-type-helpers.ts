
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
 * Convert any string ID to a properly typed lease ID
 * @param id The ID to convert
 * @returns The ID with the proper type for the lease_id column
 */
export const asLeaseId = (id: string): string => {
  return id;
};

/**
 * Convert status to the proper type for a specific table and column
 * @param table The table name
 * @param column The column name
 * @param status The status value
 * @returns The status with the proper type
 */
export const asStatusColumn = (table: string, column: string, status: string): string => {
  return status;
};

/**
 * Safely extract data from a query result
 * @param data The query result
 * @returns The extracted data or null
 */
export const safelyExtractData = <T>(data: T | null | undefined): T | null => {
  return data || null;
};

/**
 * Check if the query result has data
 * @param result The query result
 * @returns Boolean indicating if data exists
 */
export const hasData = <T>(result: { data: T | null; error?: any }): boolean => {
  return !!result.data && !result.error;
};
