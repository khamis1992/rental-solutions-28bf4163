
import { ServiceResponse, successResponse, errorResponse } from '@/utils/response-handler';

/**
 * Run a promise with a timeout to prevent hanging operations
 * 
 * @param promise The promise to execute
 * @param timeoutMs Timeout in milliseconds
 * @param operationName Name of the operation for error messages
 */
export async function withTimeout<T>(
  promise: Promise<T>, 
  timeoutMs: number = 8000,
  operationName: string = 'Operation'
): Promise<ServiceResponse<T>> {
  try {
    // Create a timeout promise that rejects after specified time
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    // Race between the actual operation and the timeout
    const result = await Promise.race([promise, timeoutPromise]);
    return successResponse(result);
  } catch (error) {
    console.error(`Error in ${operationName}:`, error);
    return errorResponse(error instanceof Error ? error : String(error));
  }
}

/**
 * Batch multiple async operations and handle them as a group
 * 
 * @param operations Array of operation functions that return promises
 * @param continueOnError Whether to continue executing after an operation fails
 */
export async function batchOperations<T>(
  operations: Array<() => Promise<T>>,
  continueOnError: boolean = false
): Promise<ServiceResponse<T[]>> {
  try {
    const results: T[] = [];
    
    for (const operation of operations) {
      try {
        const result = await operation();
        results.push(result);
      } catch (error) {
        if (!continueOnError) {
          throw error;
        }
        console.error('Operation in batch failed but continuing:', error);
      }
    }
    
    return successResponse(results);
  } catch (error) {
    return errorResponse(error instanceof Error ? error : String(error));
  }
}

/**
 * Type guard to check if a value is not null or undefined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Safely extract data from a response object that might have errors
 */
export function safeExtract<T>(response: { data?: T, error?: any }): T | null {
  if (response.error || !response.data) {
    return null;
  }
  return response.data;
}
