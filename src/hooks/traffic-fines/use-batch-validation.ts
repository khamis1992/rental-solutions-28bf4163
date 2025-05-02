
import { useState } from 'react';
import { toast } from 'sonner';
import { batchOperations } from '@/utils/promise/batch';
import { findVehicleByLicensePlate } from '@/utils/vehicle';
import { supabase } from '@/lib/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface BatchValidationOptions {
  batchSize?: number;
  concurrency?: number;
  continueOnError?: boolean;
}

export interface BatchValidationResults {
  found: {
    licensePlate: string;
    vehicleId: string;
    vehicleDetails: {
      make: string;
      model: string;
    };
  }[];
  notFound: string[];
  errors: {
    licensePlate: string;
    error: string;
  }[];
}

/**
 * Hook for batch validation operations for traffic fines
 */
export function useBatchValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState<{
    completed: number;
    total: number;
    percentComplete: number;
  } | null>(null);
  
  const queryClient = useQueryClient();
  
  const validateBatch = async (
    licensePlates: string[],
    options: BatchValidationOptions = {}
  ): Promise<BatchValidationResults> => {
    const {
      concurrency = 2,
      continueOnError = true
    } = options;
    
    if (licensePlates.length === 0) {
      return {
        found: [],
        notFound: [],
        errors: []
      };
    }
    
    try {
      setIsValidating(true);
      setValidationProgress({
        completed: 0,
        total: licensePlates.length,
        percentComplete: 0
      });
      
      // Clean up and deduplicate license plates
      const uniquePlates = [...new Set(
        licensePlates
          .map(plate => plate.trim().toUpperCase())
          .filter(Boolean)
      )];
      
      console.log(`Starting batch validation for ${uniquePlates.length} license plates`);
      
      // Use the batchOperations utility for better concurrency control
      const result = await batchOperations(
        uniquePlates,
        async (licensePlate) => {
          const result = await findVehicleByLicensePlate(licensePlate);
          
          if (!result.success || !result.data) {
            throw new Error(`Vehicle with license plate ${licensePlate} not found`);
          }
          
          return {
            licensePlate,
            vehicleId: result.data.id,
            vehicleDetails: {
              make: result.data.make,
              model: result.data.model
            }
          };
        },
        {
          concurrency,
          continueOnError,
          onProgress: (status) => {
            console.log(`Batch validation progress: ${status.completed}/${status.total}`);
            setValidationProgress({
              completed: status.completed,
              total: status.total,
              percentComplete: Math.round((status.completed / status.total) * 100)
            });
          }
        }
      );
      
      if (!result.success) {
        console.error('Batch validation failed:', result.error);
        throw result.error;
      }
      
      const found = result.data.results;
      
      const notFound = result.data.errors
        .filter(e => e.error.message.includes('not found'))
        .map(e => e.item);
      
      const errors = result.data.errors
        .filter(e => !e.error.message.includes('not found'))
        .map(e => ({
          licensePlate: e.item,
          error: e.error.message
        }));
      
      console.log(`Batch validation completed: ${found.length} found, ${notFound.length} not found, ${errors.length} errors`);
      
      return {
        found,
        notFound,
        errors
      };
    } catch (error) {
      console.error('Error in batch validation:', error);
      throw error;
    } finally {
      setIsValidating(false);
      setValidationProgress(null);
    }
  };
  
  // Mutation for processing batch operations
  const processBatchOperations = useMutation({
    mutationFn: async ({ 
      operations, 
      options = {}
    }: {
      operations: Array<() => Promise<any>>;
      options?: BatchValidationOptions;
    }) => {
      const {
        concurrency = 2,
        continueOnError = true
      } = options;
      
      setIsValidating(true);
      setValidationProgress({
        completed: 0,
        total: operations.length,
        percentComplete: 0
      });
      
      try {
        const result = await batchOperations(
          operations,
          async (operation, index) => {
            return await operation();
          },
          {
            concurrency,
            continueOnError,
            onProgress: (status) => {
              setValidationProgress({
                completed: status.completed,
                total: status.total,
                percentComplete: Math.round((status.completed / status.total) * 100)
              });
            }
          }
        );
        
        return result.data;
      } catch (error) {
        console.error('Error in batch operations:', error);
        throw error;
      } finally {
        setIsValidating(false);
        setValidationProgress(null);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
      toast.success('Batch operations completed');
    },
    onError: (error) => {
      toast.error('Batch operations failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  return {
    validateBatch,
    isValidating,
    validationProgress,
    processBatchOperations
  };
}
