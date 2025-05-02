
import { ServiceResponse, successResponse, errorResponse } from '@/utils/response-handler';

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
