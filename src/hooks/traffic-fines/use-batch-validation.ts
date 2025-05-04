
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useErrorNotification } from '@/hooks/use-error-notification';
import { 
  ApiValidationResult, 
  BatchValidationOptions, 
  BatchValidationResult, 
  ValidationError, 
  ValidationProgress 
} from './types';
import { useFineValidation } from './use-fine-validation';
import { groupValidationErrors, generateErrorSummary } from './validation-errors';

/**
 * Hook for batch validating multiple traffic fines
 */
export const useBatchValidation = () => {
  const queryClient = useQueryClient();
  const errorNotification = useErrorNotification();
  const { validateTrafficFine } = useFineValidation();
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState<ValidationProgress | null>(null);

  /**
   * Batch validate multiple license plates
   */
  const validateBatch = async (
    licensePlates: string[],
    options: BatchValidationOptions = {}
  ): Promise<BatchValidationResult> => {
    const { 
      batchSize = 5, 
      concurrency = 2, 
      continueOnError = true 
    } = options;
    
    const results: ApiValidationResult[] = [];
    const errors: ValidationError[] = [];
    
    setIsValidating(true);
    setValidationProgress({
      total: licensePlates.length,
      processed: 0,
      successful: 0,
      failed: 0,
      percentComplete: 0
    });

    try {
      // Process in batches to avoid overwhelming the API
      for (let i = 0; i < licensePlates.length; i += batchSize) {
        const batch = licensePlates.slice(i, i + batchSize);
        const batchPromises = batch.map(async (plate) => {
          try {
            const result = await validateTrafficFine(plate);
            results.push(result);
            
            setValidationProgress(prev => {
              if (!prev) return null;
              const successful = prev.successful + 1;
              const processed = prev.processed + 1;
              return {
                ...prev,
                processed,
                successful,
                percentComplete: Math.round((processed / prev.total) * 100)
              };
            });
            
            return { success: true, result };
          } catch (error: any) {
            if (!continueOnError) throw error;
            
            errors.push(error);
            
            setValidationProgress(prev => {
              if (!prev) return null;
              const failed = prev.failed + 1;
              const processed = prev.processed + 1;
              return {
                ...prev,
                processed,
                failed,
                percentComplete: Math.round((processed / prev.total) * 100)
              };
            });
            
            return { success: false, error };
          }
        });
        
        // Execute batch with limited concurrency
        for (let j = 0; j < batch.length; j += concurrency) {
          const concurrentBatch = batchPromises.slice(j, j + concurrency);
          await Promise.all(concurrentBatch);
          
          // Add a small delay between concurrent batches
          if (j + concurrency < batch.length) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
        
        // Add a delay between batches
        if (i + batchSize < licensePlates.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Process and group errors for better reporting
      const groupedErrors = groupValidationErrors(errors);
      const errorSummary = generateErrorSummary(groupedErrors);
      
      // Show summary notification
      if (results.length > 0) {
        if (errors.length > 0) {
          // Partial success
          toast.warning(
            `Validated ${results.length}/${licensePlates.length} license plates`,
            {
              description: `Failed: ${errors.length} plates. ${errorSummary}`,
              duration: 5000
            }
          );
        } else {
          // Complete success
          toast.success(
            `Validated ${results.length}/${licensePlates.length} license plates`,
            {
              description: 'All validations completed successfully'
            }
          );
        }
      } else if (errors.length > 0) {
        // Complete failure
        errorNotification.showError(
          `Validation Failed`,
          {
            description: errorSummary,
            id: 'batch-validation-error'
          }
        );
      }
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['trafficFineValidations'] });
      
      return {
        results,
        errors,
        summary: {
          total: licensePlates.length,
          succeeded: results.length,
          failed: errors.length
        }
      };
    } catch (error: any) {
      errorNotification.showError(
        'Batch Validation Failed',
        {
          description: error instanceof Error ? error.message : 'An unexpected error occurred',
          id: 'batch-validation-critical-error'
        }
      );
      
      throw error;
    } finally {
      setIsValidating(false);
    }
  };
  
  return {
    validateBatch,
    isValidating,
    validationProgress
  };
};
