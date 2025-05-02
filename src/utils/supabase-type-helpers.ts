
import { PostgrestError, PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';
import { ServiceResponse } from '@/utils/response-handler';

/**
 * Type guard to check if a Supabase response has data
 */
export function hasResponseData<T>(response: { data: T | null, error: PostgrestError | null }): response is { data: T, error: null } {
  return response && 'data' in response && response.data !== null && !response.error;
}

/**
 * Convert a Supabase query to a ServiceResponse - makes it easier to compose functions
 * @param queryFn The function that executes the Supabase query
 * @param operationName Optional name for the operation (for logging)
 * @returns A ServiceResponse with standardized error handling
 */
export async function safeQueryToServiceResponse<T>(
  queryFn: () => Promise<PostgrestResponse<T> | PostgrestSingleResponse<T>>,
  operationName?: string
): Promise<ServiceResponse<T>> {
  try {
    const response = await queryFn();
    
    if (response.error) {
      console.error(`${operationName || 'Database query'} error:`, response.error);
      return {
        success: false,
        error: response.error,
        message: response.error.message || 'Database query failed',
        statusCode: response.status || 500
      };
    }
    
    if (response.data === null) {
      return {
        success: false,
        message: 'No data returned',
        statusCode: 404
      };
    }
    
    return {
      success: true,
      data: response.data,
      statusCode: response.status || 200
    };
  } catch (error) {
    console.error(`${operationName || 'Database query'} exception:`, error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
      message: error instanceof Error ? error.message : String(error),
      statusCode: 500
    };
  }
}

/**
 * Cast UUID string for Supabase operations
 */
export function castToUUID(id: string): string {
  // In a real application, you might want to add validation here
  return id;
}
