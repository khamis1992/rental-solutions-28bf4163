
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BasicMutationResult } from '@/utils/type-utils';

export interface ValidationResult {
  licensePlate: string;
  validationDate: Date;
  validationSource: string;
  hasFine: boolean;
  details?: string;
  validationId?: string;
}

export const useTrafficFinesValidation = () => {
  const queryClient = useQueryClient();
  
  // Fetch validation history
  const { data: validationHistory, isLoading, error } = useQuery({
    queryKey: ['trafficFineValidations'],
    queryFn: async (): Promise<ValidationResult[]> => {
      try {
        const { data, error } = await supabase
          .from('traffic_fine_validations')
          .select('*')
          .order('validation_date', { ascending: false })
          .limit(20);
          
        if (error) {
          throw new Error(`Failed to fetch validation history: ${error.message}`);
        }
        
        if (!data) return [];
        
        // Transform the data to match the ValidationResult interface
        return data.map(item => {
          // Parse the result JSON field which contains our validation data
          let resultData: Record<string, any> = {};
          try {
            if (typeof item.result === 'string') {
              resultData = JSON.parse(item.result);
            } else if (typeof item.result === 'object' && item.result !== null) {
              resultData = item.result;
            }
          } catch (parseError) {
            console.error('Error parsing result data:', parseError);
            resultData = {};
          }
          
          return {
            validationId: item.id,
            licensePlate: resultData.licensePlate || '',
            validationDate: new Date(item.validation_date),
            validationSource: resultData.validationSource || 'MOI Traffic System',
            hasFine: resultData.hasFine === true,
            details: resultData.details || ''
          };
        });
      } catch (error) {
        console.error('Error fetching validation history:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  // Track validation attempts - simplified return type to avoid deep type instantiation
  const incrementValidationAttempt = async (licensePlate: string): Promise<Record<string, any> | null> => {
    try {
      // Check if we have previous validations for this license plate
      const { data: existingValidations, error: queryError } = await supabase
        .from('traffic_fine_validations')
        .select('id')
        .eq('license_plate', licensePlate)
        .maybeSingle();
      
      if (queryError) {
        console.error('Error checking validation attempts:', queryError);
        return null;
      }
      
      return existingValidations;
    } catch (error) {
      console.error('Error in incrementValidationAttempt:', error);
      return null;
    }
  };
  
  // Validate traffic fine - explicitly specify return type to avoid deep type instantiation
  const validateTrafficFine = async (licensePlate: string): Promise<ValidationResult> => {
    try {
      // Log validation attempt
      await incrementValidationAttempt(licensePlate);
      
      // Call the edge function to validate the traffic fine
      const { data, error } = await supabase.functions.invoke('validate-traffic-fine', {
        body: { licensePlate }
      });
      
      if (error) {
        console.error('Error from validation function:', error);
        throw new Error(`Validation failed: ${error.message}`);
      }
      
      // Ensure we have valid data that matches our ValidationResult interface
      const validationData = data as ValidationResult;
      
      // Store validation result in database
      const { error: logError } = await supabase
        .from('traffic_fine_validations')
        .insert({
          license_plate: validationData.licensePlate,
          validation_date: new Date().toISOString(),
          result: data,
          status: 'completed'
        });
      
      if (logError) {
        console.error('Error logging validation:', logError);
      }
      
      // Invalidate the query to refresh the validation history
      queryClient.invalidateQueries({ queryKey: ['trafficFineValidations'] });
      
      return validationData;
    } catch (error) {
      console.error('Error in validateTrafficFine:', error);
      throw error;
    }
  };
  
  // Batch validate multiple license plates
  const batchValidateTrafficFines = async (licensePlates: string[]): Promise<ValidationResult[]> => {
    const results: ValidationResult[] = [];
    const failures: string[] = [];
    
    // Process each license plate sequentially to avoid overwhelming the system
    for (const plate of licensePlates) {
      try {
        const result = await validateTrafficFine(plate);
        results.push(result);
        
        // Add a small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to validate ${plate}:`, error);
        failures.push(plate);
      }
    }
    
    // Show summary notification
    if (results.length > 0) {
      toast.success(`Validated ${results.length}/${licensePlates.length} license plates`, {
        description: failures.length > 0 ? `Failed: ${failures.length} plates` : 'All validations completed successfully'
      });
    } else if (failures.length > 0) {
      toast.error(`All validations failed (${failures.length} plates)`, {
        description: 'Please check your inputs and try again'
      });
    }
    
    return results;
  };
  
  // Manually validate a specific fine by ID - using BasicMutationResult to avoid type issues
  const validateFineById = useMutation({
    mutationFn: async (fineId: string) => {
      try {
        const { data: fine, error: fineError } = await supabase
          .from('traffic_fines')
          .select('license_plate')
          .eq('id', fineId)
          .single();
          
        if (fineError || !fine) {
          throw new Error(`Failed to retrieve fine details: ${fineError?.message || 'Fine not found'}`);
        }
        
        const result = await validateTrafficFine(fine.license_plate);
        
        // Update fine status based on validation results
        if (!result.hasFine) {
          // If no fine found in validation system, update status to paid
          const { error: updateError } = await supabase
            .from('traffic_fines')
            .update({ payment_status: 'paid', payment_date: new Date().toISOString() })
            .eq('id', fineId);
            
          if (updateError) {
            console.error(`Failed to update fine status: ${updateError.message}`);
          }
        }
        
        return { fineId, validationResult: result };
      } catch (error) {
        console.error('Error validating fine by ID:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success(`Fine validation completed`, {
        description: `Result: ${data.validationResult.hasFine ? 'Fine found' : 'No fine found'}`
      });
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
    },
    onError: (error) => {
      toast.error('Fine validation failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    }
  });
  
  // Check and update status for all pending fines - using BasicMutationResult type
  const updateAllPendingFines = useMutation({
    // Fix TypeScript error by accepting an empty object parameter
    mutationFn: async (_: any = {}) => {
      try {
        // Get all pending fines
        const { data: pendingFines, error: fetchError } = await supabase
          .from('traffic_fines')
          .select('id, license_plate')
          .eq('payment_status', 'pending');
          
        if (fetchError) {
          throw new Error(`Failed to fetch pending fines: ${fetchError.message}`);
        }
        
        if (!pendingFines || pendingFines.length === 0) {
          return { processed: 0, updated: 0, message: 'No pending fines found' };
        }
        
        let processed = 0;
        let updated = 0;
        
        // Process fines in batches of 5
        const batchSize = 5;
        for (let i = 0; i < pendingFines.length; i += batchSize) {
          const batch = pendingFines.slice(i, i + batchSize);
          
          // Process each fine in the batch
          for (const fine of batch) {
            try {
              const validationResult = await validateTrafficFine(fine.license_plate);
              processed++;
              
              // If no fine found in validation system, mark as paid
              if (!validationResult.hasFine) {
                const { error: updateError } = await supabase
                  .from('traffic_fines')
                  .update({ payment_status: 'paid', payment_date: new Date().toISOString() })
                  .eq('id', fine.id);
                  
                if (!updateError) {
                  updated++;
                }
              }
              
              // Add a delay between requests to avoid overwhelming the system
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
              console.error(`Error processing fine ${fine.id}:`, error);
              continue;
            }
          }
        }
        
        return { processed, updated, message: `Processed ${processed} fines, updated ${updated} statuses` };
      } catch (error) {
        console.error('Error in updateAllPendingFines:', error);
        throw error;
      }
    },
    onSuccess: (result) => {
      toast.success('Batch update completed', {
        description: result.message
      });
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
    },
    onError: (error) => {
      toast.error('Batch update failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    }
  });
  
  return {
    validationHistory,
    isLoading,
    error,
    validateTrafficFine,
    validateFineById,
    batchValidateTrafficFines,
    updateAllPendingFines
  };
};
