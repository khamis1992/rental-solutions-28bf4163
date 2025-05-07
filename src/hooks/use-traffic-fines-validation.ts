
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { hasData } from '@/utils/supabase-type-helpers';
import { extractArrayResponseData } from '@/utils/supabase-response-helpers';

export interface ValidationResult {
  validationId?: string;
  licensePlate: string;
  validationDate: Date;
  validationSource: string;
  hasFine: boolean;
  details?: string;
}

export const useTrafficFinesValidation = () => {
  const queryClient = useQueryClient();
  
  // Fetch validation history
  const { data: validationHistory, isLoading, error } = useQuery({
    queryKey: ['trafficFineValidations'],
    queryFn: async (): Promise<ValidationResult[]> => {
      try {
        const response = await supabase
          .from('traffic_fine_validations')
          .select('*')
          .order('validation_date', { ascending: false })
          .limit(20);
          
        if (response.error) {
          throw new Error(`Failed to fetch validation history: ${response.error.message}`);
        }
        
        // Use extractArrayResponseData to safely handle the response
        const data = extractArrayResponseData(response);
        
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
  
  // Track validation attempts
  interface ValidationAttempt {
    id: string;
    license_plate: string;
    validation_date: string;
    status: string;
  }

  const incrementValidationAttempt = async (licensePlate: string): Promise<ValidationAttempt | null> => {
    if (typeof licensePlate !== 'string' || !licensePlate.trim()) {
      throw new Error('Invalid license plate format');
    }

    try {
      const response = await supabase
        .from('traffic_fine_validations')
        .select('id, license_plate, validation_date, status')
        .eq('license_plate', licensePlate.trim())
        .maybeSingle();
      
      if (response.error) {
        console.error('Error checking validation attempts:', response.error);
        return null;
      }
      
      if (response.data) {
        return response.data as ValidationAttempt;
      }
      
      return null;
    } catch (error) {
      console.error('Error in incrementValidationAttempt:', error);
      return null;
    }
  };
  
  // Validate traffic fine - explicitly specify return type to avoid deep type instantiation
  const validateTrafficFine = useMutation({
    mutationFn: async (licensePlate: string): Promise<ValidationResult> => {
      try {
        // Log validation attempt
        await incrementValidationAttempt(licensePlate);
        
        // Call the edge function to validate the traffic fine
        const response = await supabase.functions.invoke('validate-traffic-fine', {
          body: { licensePlate }
        });
        
        if (response.error) {
          console.error('Error from validation function:', response.error);
          throw new Error(`Validation failed: ${response.error.message}`);
        }
        
        // Ensure we have valid data that matches our ValidationResult interface
        const validationData = response.data as ValidationResult;
        
        // Store validation result in database
        await supabase
          .from('traffic_fine_validations')
          .insert({
            license_plate: validationData.licensePlate,
            validation_date: new Date().toISOString(),
            result: response.data,
            status: 'completed'
          });
        
        return validationData;
      } catch (error) {
        console.error('Error in validateTrafficFine:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trafficFineValidations'] });
    },
    onError: (error: Error) => {
      toast.error(`Validation failed: ${error.message}`);
    }
  });

  return {
    validationHistory: validationHistory || [],
    isLoading,
    error,
    validateTrafficFine: validateTrafficFine.mutate,
    validateTrafficFineAsync: validateTrafficFine.mutateAsync,
    isValidating: validateTrafficFine.isPending,
  };
};
