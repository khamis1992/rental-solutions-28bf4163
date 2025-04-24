
import { Database } from '@/types/database-types';
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/postgrest-js';

/**
 * Convert any string ID to a properly typed lease ID column
 * @param id The ID to convert
 * @returns The ID with the proper type for the lease_id column
 */
export const asLeaseIdColumn = (id: string): string => {
  return id;
};

/**
 * Convert any string status to a properly typed lease status column
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
 * Generic safe data access function - ensures data exists before extracting
 * @param data Any potentially null/undefined data with properties
 * @param accessor Function to access properties from the data
 * @param defaultValue Default value to return if data is null/undefined
 * @returns The extracted value or default
 */
export const safeAccess = <T, R>(
  data: T | null | undefined,
  accessor: (data: T) => R,
  defaultValue: R
): R => {
  if (data === null || data === undefined) {
    return defaultValue;
  }
  
  try {
    return accessor(data);
  } catch (e) {
    return defaultValue;
  }
};

/**
 * Strong typed conversion for database records
 */
export function asDbRecord<T>(record: unknown): T | null {
  if (!record) {
    return null;
  }
  return record as T;
}

/**
 * Check if object is valid and has required properties
 */
export function isValidObject<T>(obj: unknown, requiredProps: (keyof T)[]): obj is T {
  if (!obj || typeof obj !== 'object') return false;
  
  return requiredProps.every(prop => 
    prop in (obj as any)
  );
}

/**
 * Enhanced safeDatabaseOperation function that properly awaits and returns results
 * and handles typing more accurately for PostgrestFilterBuilder
 */
export async function safeDatabaseOperation<T>(
  operation: () => Promise<any>,
  errorHandler?: (error: any) => void
): Promise<T | null> {
  try {
    const result = await operation();
    
    if (result.error) {
      console.error("Database operation error:", result.error);
      errorHandler?.(result.error);
      return null;
    }
    
    return result.data as T;
  } catch (err) {
    console.error("Unexpected error during database operation:", err);
    errorHandler?.(err);
    return null;
  }
}

/**
 * Safely process Supabase query results and transform to the expected type
 */
export function safelyProcessQueryResult<T, R>(
  result: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined,
  transform: (data: T) => R,
  defaultValue: R
): R {
  if (!result || result.error || !result.data) {
    console.error(result?.error || "No data returned from query");
    return defaultValue;
  }
  
  try {
    return transform(result.data);
  } catch (e) {
    console.error("Error transforming query result:", e);
    return defaultValue;
  }
}

/**
 * Helper function to safely transform Supabase response data
 * This is especially helpful for mapping to specific interface types
 */
export function safelyTransformData<T, R>(data: any, transformer: (item: any) => R): R[] {
  if (!data || !Array.isArray(data)) {
    return [] as R[];
  }

  try {
    return data.map(item => transformer(item));
  } catch (error) {
    console.error("Error transforming data:", error);
    return [] as R[];
  }
}

/**
 * Convert a Supabase query promise to a proper Promise with data extraction
 */
export function awaitableQuery<T>(query: any): Promise<T | null> {
  return query.then((result: any) => {
    if (result.error) {
      console.error("Query error:", result.error);
      return null;
    }
    return result.data;
  }).catch((error: any) => {
    console.error("Unexpected query error:", error);
    return null;
  });
}
