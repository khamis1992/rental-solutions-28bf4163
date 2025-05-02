
import { ServiceResponse, successResponse, errorResponse } from '@/utils/response-handler';

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
