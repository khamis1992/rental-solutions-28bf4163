
import { useState } from 'react';
import { batchOperations } from '@/utils/promise/batch';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { createLogger } from '@/utils/error-logger';

const logger = createLogger('traffic-fines:batch-validation');

export interface ValidationResult {
  licensePlate: string;
  validationDate: string;
  hasFine: boolean;
  details?: string;
}

export interface BatchValidationOptions {
  batchSize?: number;
  concurrency?: number;
  continueOnError?: boolean;
  delay?: number;
}

export interface BatchValidationResults {
  results: ValidationResult[];
  errors: any[];
  summary: {
    total: number;
    processed: number;
    succeeded: number;
    failed: number;
  };
}

/**
 * Hook for handling batch validation operations
 */
export function useBatchValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState<{
    processed: number;
    total: number;
    percentComplete: number;
  } | null>(null);
  
  /**
   * Validate a batch of license plates
   */
  const validateBatch = async (
    licensePlates: string[],
    options: BatchValidationOptions = {}
  ): Promise<BatchValidationResults> => {
    setIsValidating(true);
    setValidationProgress({ processed: 0, total: licensePlates.length, percentComplete: 0 });
    
    try {
      logger.info(`Starting batch validation of ${licensePlates.length} plates`);
      
      // Filter out empty plates
      const validPlates = licensePlates.filter(plate => plate && plate.trim() !== '');
      
      if (validPlates.length === 0) {
        throw new Error('No valid license plates provided');
      }
      
      // Set up options
      const { 
        batchSize = 5,
        concurrency = 2,
        continueOnError = true,
        delay = 500
      } = options;
      
      // Call the edge function to batch validate
      // For larger batches, break them down
      const results: ValidationResult[] = [];
      const errors: any[] = [];
      
      // Process in smaller chunks to avoid overwhelming the edge function
      const chunks = [];
      for (let i = 0; i < validPlates.length; i += batchSize) {
        chunks.push(validPlates.slice(i, i + batchSize));
      }
      
      // Process each chunk with configurable concurrency
      const { data } = await batchOperations<string[], any>(
        chunks,
        async (chunk) => {
          const { data, error } = await supabase.functions.invoke('validate-traffic-fine', {
            body: { licensePlates: chunk }
          });
          
          if (error) {
            logger.error(`Error in batch validation:`, error);
            throw error;
          }
          
          return data;
        },
        {
          concurrency,
          continueOnError,
          delay,
          onProgress: (status) => {
            setValidationProgress({
              processed: status.completed * batchSize > validPlates.length 
                ? validPlates.length 
                : status.completed * batchSize,
              total: validPlates.length,
              percentComplete: status.percentComplete
            });
          }
        }
      );
      
      // Flatten and process results
      data.results.forEach(chunkResult => {
        if (chunkResult && chunkResult.results) {
          results.push(...chunkResult.results);
        }
        if (chunkResult && chunkResult.errors) {
          errors.push(...chunkResult.errors);
        }
      });
      
      logger.info(`Batch validation completed: ${results.length} successes, ${errors.length} errors`);
      
      const summary = {
        total: validPlates.length,
        processed: results.length + errors.length,
        succeeded: results.length,
        failed: errors.length
      };
      
      // Show toast with results
      if (errors.length > 0) {
        toast.warning(`Validated ${results.length}/${validPlates.length} license plates`, {
          description: `${errors.length} plates failed validation`
        });
      } else {
        toast.success(`Successfully validated ${results.length} license plates`);
      }
      
      return { results, errors, summary };
    } catch (error) {
      logger.error('Batch validation failed:', error);
      
      toast.error('Batch validation failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    } finally {
      setIsValidating(false);
      // Clear progress after a brief delay
      setTimeout(() => setValidationProgress(null), 2000);
    }
  };
  
  /**
   * Process a batch of operations with progress tracking
   */
  const processBatchOperations = async <T, R>(
    items: T[],
    operation: (item: T, index: number) => Promise<R>,
    options: BatchValidationOptions = {}
  ) => {
    setIsValidating(true);
    setValidationProgress({ processed: 0, total: items.length, percentComplete: 0 });
    
    try {
      const { concurrency = 2, continueOnError = true, delay = 300 } = options;
      
      const { data } = await batchOperations<T, R>(
        items,
        operation,
        {
          concurrency,
          continueOnError,
          delay,
          onProgress: (status) => {
            setValidationProgress({
              processed: status.completed,
              total: status.total,
              percentComplete: status.percentComplete
            });
          }
        }
      );
      
      return data;
    } catch (error) {
      logger.error('Batch processing failed:', error);
      throw error;
    } finally {
      setIsValidating(false);
      // Clear progress after a brief delay
      setTimeout(() => setValidationProgress(null), 2000);
    }
  };
  
  return {
    validateBatch,
    processBatchOperations,
    isValidating,
    validationProgress
  };
}
