
import { ServiceResponse, successResponse, errorResponse } from '@/utils/response-handler';

interface BatchOptions {
  concurrency?: number;
  continueOnError?: boolean;
  delay?: number;  // Delay between operations in ms
  batchSize?: number;
  onProgress?: (status: {
    completed: number;
    total: number;
    percentComplete: number;
    current?: any;
    errors?: Error[];
  }) => void;
}

/**
 * Process an array of operations in batches with configurable concurrency
 * 
 * @param items Array of items to process
 * @param operation Function to process each item
 * @param options Configuration options
 */
export async function batchOperations<T, R>(
  items: T[],
  operation: (item: T, index: number) => Promise<R>,
  options: BatchOptions = {}
): Promise<ServiceResponse<{
  results: R[];
  errors: { item: T; error: Error; index: number }[];
  completed: number;
  total: number;
}>> {
  const {
    concurrency = 2,
    continueOnError = true,
    delay = 0,
    onProgress
  } = options;
  
  const total = items.length;
  const results: R[] = new Array(total);
  const errors: { item: T; error: Error; index: number }[] = [];
  
  let completed = 0;
  
  try {
    // Process items in batches based on concurrency
    for (let i = 0; i < total; i += concurrency) {
      const batch = items.slice(i, i + concurrency);
      const batchPromises = batch.map((item, batchIndex) => {
        const index = i + batchIndex;
        
        return (async () => {
          try {
            // Process the item
            const result = await operation(item, index);
            results[index] = result;
            return { success: true, index };
          } catch (error) {
            if (!continueOnError) {
              throw error;
            }
            
            errors.push({
              item,
              error: error instanceof Error ? error : new Error(String(error)),
              index
            });
            
            return { success: false, index };
          } finally {
            completed++;
            
            // Report progress if callback provided
            if (onProgress) {
              onProgress({
                completed,
                total,
                percentComplete: Math.round((completed / total) * 100),
                current: item
              });
            }
          }
        })();
      });
      
      // Wait for all operations in this batch to complete
      await Promise.all(batchPromises);
      
      // Add delay between batches if specified
      if (delay > 0 && i + concurrency < total) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // Check if we should continue
      if (!continueOnError && errors.length > 0) {
        break;
      }
    }
    
    return successResponse({
      results: results.filter(r => r !== undefined),
      errors,
      completed,
      total
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error : new Error(`Batch operation failed: ${String(error)}`),
      {
        results: results.filter(r => r !== undefined),
        errors,
        completed,
        total
      }
    );
  }
}
