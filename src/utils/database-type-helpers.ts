
import { Database } from '@/types/database-types';

/**
 * Convert any string ID to a properly typed lease ID column
 * @param id The ID to convert
 * @returns The ID with the proper type for the lease_id column
 */
export const asLeaseIdColumn = (id: string): string => {
  return id;
};

/**
 * Convert any string status to a properly typed status column
 * This function helps with TypeScript type safety when working with Supabase queries
 * @param table The table name
 * @param column The column name
 * @param status The status to convert
 * @returns The status with the proper type for the status column
 */
export const asStatusColumn = (table: string, column: string, status: string): string => {
  return status;
};

/**
 * Convert any string status to a properly typed payment status column
 * @param status The status to convert
 * @returns The status with the proper type for the status column
 */
export const asPaymentStatusColumn = (status: string): string => {
  return status;
};

// Restore other previously removed column conversion functions
export const asAgreementIdColumn = (id: string): string => {
  return id;
};

export const asImportIdColumn = (id: string): string => {
  return id;
};

export const asTrafficFineIdColumn = (id: string): string => {
  return id;
};

export const asPaymentId = (id: string): string => {
  return id;
};

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

/**
 * Safely handles the case when a Supabase query result may include profiles data
 * @param data The raw data from a Supabase query
 * @returns The input data with safely accessed profiles
 */
export const safelyAccessProfiles = (data: any): any => {
  if (!data) return null;
  
  try {
    // Check if profiles exists and access it safely
    const profiles = data.profiles || null;
    return {
      ...data,
      customer_name: profiles?.full_name || null
    };
  } catch (error) {
    console.error("Error accessing profiles data:", error);
    return data;
  }
};

/**
 * Safely extract rent amount from agreements
 * @param agreements Array of agreement data
 * @returns Total rent amount
 */
export const safelyCalculateRentAmount = (agreements: any[] | null): number => {
  if (!agreements || !Array.isArray(agreements)) return 0;
  
  return agreements.reduce((sum, agreement) => {
    // Safely access the rent_amount property
    const rentAmount = agreement?.rent_amount || 0;
    return sum + parseFloat(rentAmount);
  }, 0);
};

/**
 * Safely access properties from potentially undefined objects
 * @param obj The object to access
 * @param key The key to access
 * @returns The value or undefined
 */
export const safelyAccessProperty = <T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined => {
  if (!obj) return undefined;
  return obj[key];
};

/**
 * Check if a result is an error
 * @param result The result to check
 * @returns Boolean indicating if the result is an error
 */
export const isError = (result: any): boolean => {
  return result?.error !== undefined;
};

/**
 * Safely parse data from a Supabase query
 * @param response The Supabase response
 * @returns The parsed data or an empty array
 */
export const safelyParseData = <T>(response: any): T[] => {
  if (isError(response) || !response?.data) {
    return [];
  }
  return response.data as T[];
};

