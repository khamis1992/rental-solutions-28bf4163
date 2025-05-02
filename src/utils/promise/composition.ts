
import { ServiceResponse, successResponse, errorResponse } from '@/utils/response-handler';
import { withTimeout } from './timeout';

/**
 * Compose multiple operations into a single operation that runs them in sequence
 * passing the result of each operation to the next
 * 
 * @param operations Array of operations to compose
 */
export async function chainOperations<T>(
  operations: Array<(input?: any) => Promise<T>>,
  options: {
    timeoutMs?: number;
    continueOnError?: boolean;
    operationName?: string;
    onProgress?: (message: string) => void;
  } = {}
): Promise<ServiceResponse<T>> {
  const {
    timeoutMs = 10000,
    continueOnError = false,
    operationName = 'Operation chain',
    onProgress
  } = options;
  
  let result: any = null;
  let lastError: Error | null = null;
  
  try {
    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      
      if (onProgress) {
        onProgress(`Running operation ${i + 1}/${operations.length}`);
      }
      
      try {
        // Run each operation with a timeout, passing the result of the previous operation
        const opResult = await withTimeout(
          operation(result),
          timeoutMs,
          `${operationName} step ${i + 1}/${operations.length}`,
          onProgress
        );
        
        if (!opResult.success) {
          if (!continueOnError) {
            return opResult; // Return the error result
          }
          
          lastError = opResult.error || new Error(`Step ${i + 1} failed`);
          continue; // Skip to the next operation
        }
        
        result = opResult.data;
      } catch (error) {
        if (!continueOnError) {
          throw error;
        }
        
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }
    
    if (lastError && !result) {
      return errorResponse(lastError);
    }
    
    return successResponse(result);
  } catch (error) {
    if (onProgress) {
      onProgress(`${operationName} chain failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    return errorResponse(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Compose multiple operations into a single operation that runs them in parallel
 * and collects all the results
 * 
 * @param operations Array of operations to compose
 * @returns Array of results in the same order as the operations
 */
export async function composeOperations<T>(
  operations: Array<() => Promise<T>>,
  options: {
    timeoutMs?: number;
    allSettled?: boolean;
    operationName?: string;
  } = {}
): Promise<ServiceResponse<T[]>> {
  const {
    timeoutMs = 10000,
    allSettled = true,  // Wait for all operations to complete or fail
    operationName = 'Parallel operations'
  } = options;
  
  try {
    const operationsWithTimeout = operations.map((op, index) => 
      withTimeout(
        op(),
        timeoutMs,
        `${operationName} #${index + 1}/${operations.length}`
      )
    );
    
    if (allSettled) {
      // Wait for all operations to complete or fail
      const results = await Promise.allSettled(operationsWithTimeout);
      
      const successResults = results
        .filter((r): r is PromiseFulfilledResult<ServiceResponse<T>> => r.status === 'fulfilled' && r.value.success)
        .map(r => r.value.data);
      
      const errors = results
        .filter((r): r is PromiseRejectedResult | PromiseFulfilledResult<ServiceResponse<T>> => 
          r.status === 'rejected' || !r.value.success
        )
        .map(r => r.status === 'rejected' ? r.reason : r.value.error);
      
      if (errors.length > 0 && successResults.length === 0) {
        return errorResponse(errors[0], errors);
      }
      
      return successResponse(successResults);
    } else {
      // Use Promise.all to fail fast if any operation fails
      const results = await Promise.all(operationsWithTimeout);
      
      // Extract data from successful operations
      const data = results
        .filter(r => r.success)
        .map(r => r.data);
      
      return successResponse(data);
    }
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error : new Error(`Parallel operations failed: ${String(error)}`)
    );
  }
}
