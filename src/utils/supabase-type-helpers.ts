
import { PostgrestError } from '@supabase/supabase-js';
import { ServiceResponse, successResponse, errorResponse } from './response-handler';

/**
 * Type guard to check if a response has data
 */
export function hasResponseData<T>(response: { data: T | null; error: PostgrestError | null }): response is { data: T; error: null } {
  return response.data !== null && response.error === null;
}

/**
 * Convert a Supabase response to a ServiceResponse
 */
export function toServiceResponse<T>(response: { data: T | null; error: PostgrestError | null }): ServiceResponse<T> {
  if (response.error) {
    return errorResponse(response.error);
  }
  
  if (response.data === null) {
    return errorResponse('No data returned');
  }
  
  return successResponse(response.data);
}

/**
 * Safely convert a Supabase query to a ServiceResponse
 */
export async function safeQueryToServiceResponse<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  context?: string
): Promise<ServiceResponse<T>> {
  try {
    const response = await queryFn();
    
    if (response.error) {
      console.error(context ? `${context}: ${response.error.message}` : response.error.message);
      return errorResponse(response.error);
    }
    
    if (response.data === null) {
      return errorResponse('No data returned');
    }
    
    return successResponse(response.data);
  } catch (error) {
    console.error(context ? `${context}: ${error}` : error);
    return errorResponse(error instanceof Error ? error : String(error));
  }
}

/**
 * Handle a collection of Supabase queries safely
 */
export async function safeQueriesInParallel<T extends Record<string, any>>(
  queries: { [K in keyof T]: () => Promise<{ data: T[K] | null; error: PostgrestError | null }> }
): Promise<{ [K in keyof T]: ServiceResponse<T[K]> }> {
  const keys = Object.keys(queries) as Array<keyof T>;
  const results: Record<string, ServiceResponse<any>> = {};
  
  await Promise.all(keys.map(async (key) => {
    try {
      const response = await queries[key]();
      
      if (response.error) {
        results[key as string] = errorResponse(response.error);
      } else if (response.data === null) {
        results[key as string] = errorResponse(`No data returned for ${String(key)}`);
      } else {
        results[key as string] = successResponse(response.data);
      }
    } catch (error) {
      results[key as string] = errorResponse(error instanceof Error ? error : String(error));
    }
  }));
  
  return results as { [K in keyof T]: ServiceResponse<T[K]> };
}

/**
 * Extract data safely from a Supabase response or return a default value
 */
export function extractDataOrDefault<T>(
  response: { data: T | null; error: PostgrestError | null },
  defaultValue: T
): T {
  if (response.error || response.data === null) {
    return defaultValue;
  }
  return response.data;
}

/**
 * Convert a PostgrestError to a more useful format
 */
export function formatPostgrestError(error: PostgrestError): {
  message: string;
  code: string;
  details: string;
  hint?: string;
} {
  return {
    message: error.message,
    code: error.code,
    details: error.details || '',
    hint: error.hint
  };
}
