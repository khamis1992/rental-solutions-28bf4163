
import { ServiceResponse, successResponse, errorResponse } from '@/utils/response-handler';

/**
 * Run a promise with a timeout to prevent hanging operations
 * 
 * @param promise The promise to execute
 * @param timeoutMs Timeout in milliseconds
 * @param operationName Name of the operation for error messages
 * @param onProgress Optional callback for progress updates
 */
export async function withTimeout<T>(
  promise: Promise<T>, 
  timeoutMs: number = 8000,
  operationName: string = 'Operation',
  onProgress?: (message: string) => void
): Promise<ServiceResponse<T>> {
  try {
    // Optional progress reporting
    if (onProgress) {
      onProgress(`Starting ${operationName}...`);
    }
    
    // Create a timeout promise that rejects after specified time
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      
      // Store the timeout ID to allow cleanup
      return () => clearTimeout(timeoutId);
    });

    // Race between the actual operation and the timeout
    const result = await Promise.race([promise, timeoutPromise]);
    
    if (onProgress) {
      onProgress(`${operationName} completed successfully`);
    }
    
    return successResponse(result);
  } catch (error) {
    console.error(`Error in ${operationName}:`, error);
    
    if (onProgress) {
      onProgress(`Error in ${operationName}: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    return errorResponse(error instanceof Error ? error : String(error));
  }
}

/**
 * Run multiple promises with a timeout, returning the first to complete successfully
 * 
 * @param promises Array of promises to execute in parallel
 * @param timeoutMs Timeout for the entire operation
 * @param operationName Name of the operation for error messages
 */
export async function withTimeoutRace<T>(
  promises: Array<Promise<T>>,
  timeoutMs: number = 10000,
  operationName: string = 'Operation'
): Promise<ServiceResponse<T>> {
  try {
    // Create a timeout promise that rejects after specified time
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    // Race between all operations and the timeout
    const result = await Promise.race([...promises, timeoutPromise]);
    return successResponse(result);
  } catch (error) {
    console.error(`Error in ${operationName}:`, error);
    return errorResponse(error instanceof Error ? error : String(error));
  }
}
