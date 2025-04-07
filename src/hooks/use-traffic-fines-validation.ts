
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ValidationResult {
  success: boolean;
  licensePlate: string;
  hasFine: boolean;
  validationDate: string;
  validationSource: string;
  fineDetails?: {
    amount: number;
    violationDate: string;
    violationType: string;
    locationCode: string;
  };
  error?: string;
}

export interface ValidationHistoryItem {
  id: string;
  fineId: string;
  validationDate: Date;
  result: ValidationResult;
  status: 'success' | 'error';
}

export const useTrafficFinesValidation = () => {
  const [isValidating, setIsValidating] = useState(false);

  // Validate a traffic fine against MOI website
  const validateTrafficFine = useMutation({
    mutationFn: async (licensePlate: string): Promise<ValidationResult> => {
      setIsValidating(true);
      try {
        const { data, error } = await supabase.functions.invoke('validate-traffic-fine', {
          body: { licensePlate }
        });
        
        if (error) {
          throw new Error(`Validation error: ${error.message}`);
        }
        
        return data.result;
      } catch (error) {
        console.error('Error validating traffic fine:', error);
        throw error;
      } finally {
        setIsValidating(false);
      }
    },
    onSuccess: (data) => {
      toast.success(`Validation completed for ${data.licensePlate}`, {
        description: data.hasFine 
          ? 'Traffic fine found in MOI system.' 
          : 'No traffic fine found in MOI system.'
      });
    },
    onError: (error) => {
      toast.error('Failed to validate traffic fine', {
        description: error.message || 'An unexpected error occurred'
      });
    }
  });

  // Update a fine's validation status in the database
  const updateFineValidationStatus = useMutation({
    mutationFn: async ({ 
      fineId, 
      validationResult, 
      newStatus 
    }: { 
      fineId: string; 
      validationResult: ValidationResult;
      newStatus: 'pending' | 'paid' | 'validated' | 'invalid';
    }) => {
      const { error } = await supabase
        .from('traffic_fines')
        .update({
          validation_status: newStatus,
          last_check_date: new Date().toISOString(),
          validation_result: validationResult
        })
        .eq('id', fineId);
      
      if (error) {
        throw new Error(`Failed to update fine status: ${error.message}`);
      }
      
      return { success: true, fineId };
    },
    onSuccess: (_, variables) => {
      toast.success(`Fine status updated to ${variables.newStatus}`);
    },
    onError: (error) => {
      toast.error('Failed to update fine status', {
        description: error.message || 'An unexpected error occurred'
      });
    }
  });

  // Get validation history for a specific fine
  const getValidationHistory = useQuery({
    queryKey: ['validationHistory'],
    queryFn: async (): Promise<ValidationHistoryItem[]> => {
      try {
        const { data, error } = await supabase
          .from('traffic_fine_validations')
          .select('*')
          .order('validation_date', { ascending: false });
        
        if (error) {
          throw new Error(`Failed to fetch validation history: ${error.message}`);
        }
        
        return data.map(item => ({
          id: item.id,
          fineId: item.fine_id,
          validationDate: new Date(item.validation_date),
          result: item.result,
          status: item.status
        }));
      } catch (error) {
        console.error('Error fetching validation history:', error);
        throw error;
      }
    },
    enabled: false // Only run when explicitly requested
  });

  return {
    validateTrafficFine,
    updateFineValidationStatus,
    getValidationHistory,
    isValidating
  };
};
