
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
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
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
      // Use regular update to increment validation attempts, since RPC is not available
      const { data: currentFine, error: fetchError } = await supabase
        .from('traffic_fines')
        .select('validation_attempts')
        .eq('id', fineId)
        .single();
        
      if (fetchError) {
        console.error('Error getting current validation attempts:', fetchError);
      }
      
      const attempts = (currentFine?.validation_attempts || 0) + 1;
      
      const { error } = await supabase
        .from('traffic_fines')
        .update({
          validation_status: newStatus,
          last_check_date: new Date().toISOString(),
          validation_result: JSON.stringify(validationResult), // Convert to JSON string for storage
          validation_date: new Date().toISOString(),
          validation_attempts: attempts
        })
        .eq('id', fineId);
      
      if (error) {
        throw new Error(`Failed to update fine status: ${error.message}`);
      }
      
      // Log the validation attempt to history table directly
      try {
        await supabase.rpc('log_traffic_fine_validation', {
          p_fine_id: fineId,
          p_status: validationResult.success ? 'success' : 'error',
          p_result: JSON.stringify(validationResult),
          p_error_message: validationResult.error || null
        });
      } catch (historyError) {
        console.error('Failed to log validation history using RPC:', historyError);
        
        // Fallback to direct insertion if RPC fails
        const { error: insertError } = await supabase
          .from('traffic_fine_validations')
          .insert({
            fine_id: fineId,
            status: validationResult.success ? 'success' : 'error',
            result: JSON.stringify(validationResult),
            error_message: validationResult.error
          });
          
        if (insertError) {
          console.error('Failed to log validation history:', insertError);
        }
      }
      
      return { success: true, fineId };
    },
    onSuccess: (_, variables) => {
      toast.success(`Fine status updated to ${variables.newStatus}`);
    },
    onError: (error) => {
      toast.error('Failed to update fine status', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    }
  });

  // Get validation history for specific fines
  const getValidationHistory = useQuery({
    queryKey: ['validationHistory'],
    queryFn: async (): Promise<ValidationHistoryItem[]> => {
      try {
        // Use data from a view or directly query the table if it exists
        const { data, error } = await supabase
          .from('traffic_fine_validations_view') // Using a view for compatibility
          .select('*')
          .order('validation_date', { ascending: false })
          .limit(10);
        
        if (error) throw error;
        
        if (!data) return [];
        
        // Parse the JSON result field
        return data.map((item: any) => ({
          id: item.id,
          fineId: item.fine_id,
          validationDate: new Date(item.validation_date),
          result: JSON.parse(item.result),
          status: item.status as 'success' | 'error'
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
