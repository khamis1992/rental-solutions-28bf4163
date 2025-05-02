/**
 * Type-safe helpers for working with Supabase responses
 */

import { ServiceResponse, successResponse, errorResponse } from './response-handler';

/**
 * Type guard to check if a database response has data
 */
export function hasResponseData<T>(response: any): response is { data: T; error: null } {
  // Handle PostgreSQL response format
  if (response && typeof response === 'object') {
    // Check for basic structure
    const hasDataField = 'data' in response && response.data !== null && response.data !== undefined;
    const noError = !response.error;
    
    return hasDataField && noError;
  }
  return false;
}

/**
 * Alias for hasResponseData to avoid breaking existing code
 */
export function hasData<T>(response: any): response is { data: T; error: null } {
  return hasResponseData<T>(response);
}

/**
 * Safe accessor for PostgreSQL response data
 */
export function getResponseData<T>(response: any): T | null {
  if (hasResponseData<T>(response)) {
    return response.data;
  }
  return null;
}

/**
 * Utility to convert Supabase query errors to ServiceResponse format
 */
export function safeQueryToServiceResponse<T>(
  queryFn: () => Promise<any>,
  context?: string
): Promise<ServiceResponse<T>> {
  return new Promise(async (resolve) => {
    try {
      const result = await queryFn();
      
      if (hasResponseData<T>(result)) {
        resolve(successResponse(result.data));
      } else {
        const errorMsg = result.error ? result.error.message || String(result.error) : 'Unknown database error';
        console.error(`${context || 'Database query'} error:`, result.error);
        resolve(errorResponse(errorMsg));
      }
    } catch (err) {
      console.error(`${context || 'Database operation'} exception:`, err);
      resolve(errorResponse(err instanceof Error ? err : String(err)));
    }
  });
}

/**
 * Safe wrapper for database ID types
 */
export function asTableId<T extends string>(id: string): T {
  return id as T;
}

/**
 * Convert any query error into a service response
 */
export function handleSupabaseError<T>(error: any, context?: string): ServiceResponse<T> {
  const errorMsg = error instanceof Error ? error.message : String(error);
  console.error(`${context || 'Supabase operation'} error:`, error);
  return errorResponse(errorMsg);
}

/**
 * Helper function to cast a string to UUID safely
 */
export function castToUUID(id: string): string {
  return id;
}
