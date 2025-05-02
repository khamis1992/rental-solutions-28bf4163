
import { useState } from 'react';
import { toast } from 'sonner';
import { useErrorNotification } from '@/hooks/use-error-notification';
import { processBatches } from '@/utils/concurrency-utils';
import { batchOperations } from '@/utils/promise/batch';
import { ValidationError, mapToValidationError } from '@/utils/validation/traffic-fine-validation-errors';
import { ValidationResult } from '@/hooks/use-traffic-fines-validation';
import { supabase } from '@/lib/supabase';

export interface BatchValidationOptions {
  batchSize?: number;
  concurrency?: number;
  continueOnError?: boolean;
}

export interface BatchValidationResults {
  results: ValidationResult[];
  errors: ValidationError[];
  summary: {
    total: number;
    succeeded: number;
    failed: number;
    errorsByType: Record<string, number>;
  };
}

const DEFAULT_OPTIONS: BatchValidationOptions = {
  batchSize: 5,
  concurrency: 2,
  continueOnError: true
};

export function useBatchValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const errorNotification = useErrorNotification();

  /**
   * Process a batch of license plates with proper concurrency control
   */
  const validateBatch = async (
    licensePlates: string[], 
    options: BatchValidationOptions = {}
  ): Promise<BatchValidationResults> => {
    const { batchSize, concurrency, continueOnError } = { ...DEFAULT_OPTIONS, ...options };
    
    if (!licensePlates?.length) {
      return {
        results: [],
        errors: [],
        summary: { total: 0, succeeded: 0, failed: 0, errorsByType: {} }
      };
    }
    
    try {
      setIsValidating(true);
      
      // Prepare clean data (trim and remove duplicates)
      const uniqueLicensePlates = [...new Set(licensePlates.map(plate => plate.trim()))].filter(Boolean);
      
      const errorsByType: Record<string, number> = {};
      const results: ValidationResult[] = [];
      const errors: ValidationError[] = [];
      
      // Show starting toast
      toast.info(`Starting validation for ${uniqueLicensePlates.length} license plates...`);
      
      // Use processBatches for better concurrency control
      await processBatches(
        uniqueLicensePlates,
        batchSize,
        concurrency,
        async (plate: string) => {
          try {
            // Call the validation function
            const { data, error } = await supabase.functions.invoke('validate-traffic-fine', {
              body: { licensePlate: plate }
            });
            
            if (error) {
              throw new Error(`Validation failed: ${error.message}`);
            }
            
            // Store validation result in database
            await supabase
              .from('traffic_fine_validations')
              .insert({
                license_plate: plate,
                validation_date: new Date().toISOString(),
                result: data,
                status: 'completed'
              });
              
            results.push(data as ValidationResult);
            return data;
          } catch (error) {
            const validationError = mapToValidationError(error, plate);
            
            // Track errors by type
            if (!errorsByType[validationError.code]) {
              errorsByType[validationError.code] = 0;
            }
            errorsByType[validationError.code]++;
            
            errors.push(validationError);
            
            if (!continueOnError) {
              throw validationError;
            }
            
            return null;
          }
        },
        (batchResults, batchIndex) => {
          // Report progress after each batch
          const validResultsCount = batchResults.filter(Boolean).length;
          toast.info(`Processed batch ${batchIndex + 1}`, {
            description: `${validResultsCount}/${batchResults.length} validations successful`
          });
        }
      );
      
      // Show final summary toast
      const succeeded = results.length;
      const failed = errors.length;
      const total = succeeded + failed;
      
      if (failed === 0) {
        toast.success(`Validated ${succeeded}/${total} license plates successfully`);
      } else {
        const errorMessage = Object.entries(errorsByType)
          .map(([code, count]) => `${code} (${count})`)
          .join(", ");
          
        toast.warning(
          `Validated ${succeeded}/${total} license plates`,
          { description: `Errors: ${errorMessage}` }
        );
      }
      
      return {
        results,
        errors,
        summary: {
          total,
          succeeded,
          failed,
          errorsByType
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      errorNotification.showError('Batch Validation Failed', {
        description: errorMessage,
        id: 'batch-validation-error'
      });
      
      throw error;
    } finally {
      setIsValidating(false);
    }
  };
  
  /**
   * Process multiple operations with transaction-like behavior
   * Either all succeed or none (with rollback capabilities)
   */
  const processBatchOperations = async <T>(
    operations: Array<() => Promise<T>>, 
    options: { continueOnError?: boolean; description?: string } = {}
  ) => {
    const { continueOnError = false, description = 'batch operations' } = options;
    
    try {
      setIsValidating(true);
      
      const response = await batchOperations(operations, continueOnError);
      
      if (response.error) {
        errorNotification.showError(`Failed to complete ${description}`, {
          description: response.error.message,
          id: 'batch-operations-error'
        });
        return { success: false, error: response.error, results: [] };
      }
      
      return { 
        success: true, 
        results: response.data,
        error: null
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      errorNotification.showError(`Error in ${description}`, {
        description: errorMessage,
        id: 'batch-operations-error'
      });
      
      return { success: false, error, results: [] };
    } finally {
      setIsValidating(false);
    }
  };
  
  return {
    validateBatch,
    processBatchOperations,
    isValidating
  };
}
