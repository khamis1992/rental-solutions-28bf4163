
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
    queryFn: async () => {
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
          let resultData = {};
          try {
            if (typeof item.result === 'string') {
              resultData = JSON.parse(item.result);
            } else if (typeof item.result === 'object') {
              resultData = item.result;
            }
          } catch (parseError) {
            console.error('Error parsing result data:', parseError);
            resultData = {};
          }
          
          return {
            validationId: item.id,
            licensePlate: resultData?.licensePlate || '',
            validationDate: new Date(item.validation_date),
            validationSource: resultData?.validationSource || 'MOI Traffic System',
            hasFine: resultData?.hasFine === true,
            details: resultData?.details || ''
          };
        });
      } catch (error) {
        console.error('Error fetching validation history:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  // Track validation attempts - but don't use the nonexistent table/function
  // We'll use direct inserts/updates instead
  const incrementValidationAttempt = async (licensePlate: string) => {
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
  
  // Validate traffic fine
  const validateTrafficFine = async (licensePlate: string): Promise<ValidationResult> => {
    try {
      // Log validation attempt - simplified to avoid using nonexistent RPC function
      await incrementValidationAttempt(licensePlate);
      
      // Call the edge function to validate the traffic fine
      const { data, error } = await supabase.functions.invoke('validate-traffic-fine', {
        body: { licensePlate }
      });
      
      if (error) {
        console.error('Error from validation function:', error);
        throw new Error(`Validation failed: ${error.message}`);
      }
      
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
  
  // Manually validate a specific fine by ID
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
        
        return { fineId, validationResult: result };
      } catch (error) {
        console.error('Error validating fine by ID:', error);
        throw error;
      }
    },
    onSuccess: ({ fineId, validationResult }) => {
      toast.success(`Fine validation completed`, {
        description: `Result: ${validationResult.hasFine ? 'Fine found' : 'No fine found'}`
      });
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
    },
    onError: (error) => {
      toast.error('Fine validation failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    }
  });
  
  return {
    validationHistory,
    isLoading,
    error,
    validateTrafficFine,
    validateFineById
  };
};
