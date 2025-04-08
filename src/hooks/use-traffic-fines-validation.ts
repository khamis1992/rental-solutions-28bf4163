
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
        return data.map(item => ({
          validationId: item.id,
          licensePlate: item.license_plate,
          validationDate: new Date(item.validation_date),
          validationSource: item.validation_source,
          hasFine: item.has_fine,
          details: item.details
        }));
      } catch (error) {
        console.error('Error fetching validation history:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  // Increment validation attempts
  const incrementValidationAttempt = async (licensePlate: string) => {
    try {
      const { data, error } = await supabase.rpc('increment_validation_attempts', {
        p_license_plate: licensePlate
      });
      
      if (error) {
        console.error('Error incrementing validation attempts:', error);
      }
      
      return data;
    } catch (error) {
      console.error('Error in incrementValidationAttempt:', error);
    }
  };
  
  // Validate traffic fine
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
      
      // Log the validation result
      const { error: logError } = await supabase.rpc('log_traffic_fine_validation', {
        p_license_plate: licensePlate,
        p_has_fine: data.hasFine,
        p_validation_source: data.validationSource,
        p_details: data.details || null
      });
      
      if (logError) {
        console.error('Error logging validation:', logError);
      }
      
      // Invalidate the query to refresh the validation history
      queryClient.invalidateQueries({ queryKey: ['trafficFineValidations'] });
      
      return data as ValidationResult;
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
        
        return { fineId, validationResult: result as ValidationResult };
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
