
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

export interface ValidationResult {
  licensePlate: string;
  validationDate: string;
  validationSource: string;
  hasFine: boolean;
  error?: string;
  fineDetails?: {
    violationType?: string;
    amount?: number;
    location?: string;
    date?: string;
    violationDate?: string;
    locationCode?: string;
  };
}

export interface ValidationHistoryItem {
  id: string;
  validationDate: Date;
  result: ValidationResult;
}

export const useTrafficFinesValidation = () => {
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    licensePlate: '',
    validationDate: new Date().toISOString(),
    validationSource: 'MOI Qatar Database',
    hasFine: false
  });

  // Mutation for validating traffic fines
  const validateTrafficFine = useMutation({
    mutationFn: async (licensePlate: string): Promise<ValidationResult> => {
      if (!licensePlate.trim()) {
        throw new Error("License plate is required");
      }

      try {
        // Increment validation attempts counter for tracking purposes
        try {
          // Create a custom type declaration for the RPC function
          await supabase.rpc('increment_validation_attempts', {
            p_license_plate: licensePlate
          } as any);
        } catch (error) {
          console.error('Failed to increment validation attempts:', error);
          // Continue execution even if this fails
        }

        // In a real implementation, this would call an external API
        // For demo, we'll generate a random result
        const randomResult: ValidationResult = {
          licensePlate,
          validationDate: new Date().toISOString(),
          validationSource: 'MOI Qatar Database',
          hasFine: Math.random() > 0.6,
          fineDetails: undefined
        };

        // Simulate fine details if a fine was found
        if (randomResult.hasFine) {
          randomResult.fineDetails = {
            violationType: ['Speeding', 'Red Light', 'Illegal Parking', 'No Parking Zone'][Math.floor(Math.random() * 4)],
            amount: Math.floor(Math.random() * 1000) + 100,
            location: ['Corniche Road', 'Al Waab Street', 'C Ring Road', 'Airport Road'][Math.floor(Math.random() * 4)],
            date: new Date().toISOString(),
            violationDate: new Date().toISOString(),
            locationCode: ['A123', 'B456', 'C789', 'D012'][Math.floor(Math.random() * 4)]
          };
        }

        // Log the validation result to the database
        await supabase.from('traffic_fine_validations').insert({
          fine_id: null, // We're validating without a specific fine ID
          result: randomResult as any,
          status: randomResult.hasFine ? 'fine_found' : 'no_fine',
        });

        // Log the traffic fine validation
        try {
          // Create a custom type declaration for the RPC function
          await supabase.rpc('log_traffic_fine_validation', {
            p_license_plate: licensePlate,
            p_has_fine: randomResult.hasFine
          } as any);
        } catch (error) {
          console.error('Failed to log validation:', error);
          // Continue execution even if this fails
        }

        setValidationResult(randomResult);
        return randomResult;
      } catch (error) {
        console.error('Error validating traffic fine:', error);
        const errorResult: ValidationResult = {
          licensePlate,
          validationDate: new Date().toISOString(),
          validationSource: 'MOI Qatar Database',
          hasFine: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
        setValidationResult(errorResult);
        return errorResult;
      }
    },
  });

  // Query for fetching validation history
  const { 
    data: validationHistory = [], 
    isLoading: isLoadingHistory, 
    error: historyError,
    refetch: refetchHistory 
  } = useQuery({
    queryKey: ['trafficFineValidations'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('traffic_fine_validations')
          .select('*')
          .order('validation_date', { ascending: false })
          .limit(10);

        if (error) throw error;

        return (data || []).map(item => ({
          id: item.id,
          validationDate: new Date(item.validation_date),
          result: item.result as ValidationResult
        }));
      } catch (error) {
        console.error('Error fetching validation history:', error);
        throw error;
      }
    },
  });

  return {
    validateTrafficFine,
    validationResult,
    isValidating: validateTrafficFine.isPending,
    validationHistory,
    isLoadingHistory,
    historyError,
    refetchHistory
  };
};
