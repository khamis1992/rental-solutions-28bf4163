
import { ServiceResponse, successResponse, errorResponse } from '@/utils/response-handler';
import { withTimeout } from './timeout';

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
