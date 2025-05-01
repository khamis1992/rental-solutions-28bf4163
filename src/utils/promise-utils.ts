
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
 * Execute a promise with retries and timeout
 * 
 * @param operation Function that returns a promise
 * @param options Configuration options
 */
export async function withTimeoutAndRetry<T>(
  operation: () => Promise<T>,
  options: {
    timeoutMs?: number;
    retries?: number; 
    retryDelayMs?: number;
    operationName?: string;
    onProgress?: (message: string) => void;
    shouldRetry?: (error: any) => boolean;
  } = {}
): Promise<ServiceResponse<T>> {
  const {
    timeoutMs = 8000,
    retries = 2,
    retryDelayMs = 1000,
    operationName = 'Operation',
    onProgress,
    shouldRetry = () => true
  } = options;
  
  let lastError: any = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      if (onProgress) {
        onProgress(`Retrying ${operationName} (attempt ${attempt}/${retries})...`);
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, retryDelayMs));
    }
    
    // Execute the operation with timeout
    const result = await withTimeout(
      operation(),
      timeoutMs,
      `${operationName}${attempt > 0 ? ` (attempt ${attempt + 1})` : ''}`,
      onProgress
    );
    
    // If successful or we shouldn't retry this error, return the result
    if (result.success || (result.error && !shouldRetry(result.error))) {
      return result;
    }
    
    // Store the error for the next iteration or final return
    lastError = result.error || new Error('Unknown error');
  }
  
  // All retries failed
  if (onProgress) {
    onProgress(`${operationName} failed after ${retries + 1} attempts`);
  }
  
  return errorResponse(lastError);
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

/**
 * Compose multiple async operations with ServiceResponse format
 * Each function receives the result of the previous function
 */
export async function composeOperations<T>(
  initialValue: T,
  ...operations: Array<(input: T) => Promise<ServiceResponse<T>>>
): Promise<ServiceResponse<T>> {
  try {
    let currentValue = initialValue;
    
    for (const operation of operations) {
      const result = await operation(currentValue);
      
      if (!result.success) {
        return result; // Return first error encountered
      }
      
      currentValue = result.data!;
    }
    
    return successResponse(currentValue);
  } catch (error) {
    return errorResponse(error instanceof Error ? error : String(error));
  }
}

/**
 * Chain multiple async operations that return ServiceResponse
 * Each function receives the unwrapped result of the previous function
 * Short-circuits on the first error
 */
export async function chainOperations<T>(
  initialPromise: Promise<ServiceResponse<T>>,
  ...operations: Array<(input: T) => Promise<ServiceResponse<any>>>
): Promise<ServiceResponse<any>> {
  try {
    const initialResult = await initialPromise;
    
    if (!initialResult.success) {
      return initialResult;
    }
    
    let currentValue = initialResult.data!;
    let lastResult: ServiceResponse<any> = initialResult;
    
    for (const operation of operations) {
      lastResult = await operation(currentValue);
      
      if (!lastResult.success) {
        return lastResult; // Return first error encountered
      }
      
      currentValue = lastResult.data;
    }
    
    return lastResult;
  } catch (error) {
    return errorResponse(error instanceof Error ? error : String(error));
  }
}
