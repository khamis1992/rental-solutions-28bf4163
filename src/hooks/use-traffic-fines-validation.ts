
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { hasData, isObject } from '@/utils/supabase-response-helpers';

export function useTrafficFinesValidation(fineId?: string | null) {
  const validateFine = useMutation({
    mutationFn: async (licensePlate: string) => {
      if (!licensePlate) {
        throw new Error('License plate is required');
      }

      const functionResponse = await supabase.functions.invoke('validate-traffic-fine', {
        body: { license_plate: licensePlate }
      });

      if (functionResponse.error) {
        throw new Error(`Validation error: ${functionResponse.error.message}`);
      }

      // Log the validation result to database
      const insertResponse = await supabase
        .from('traffic_fine_validations')
        .insert({
          license_plate: licensePlate,
          result: functionResponse.data || {},
          status: 'completed',
          fine_id: fineId || null
        })
        .select();

      // Response handling with better type safety
      if (!hasData(insertResponse)) {
        throw new Error(`Error logging validation: ${insertResponse?.error?.message || 'Unknown error'}`);
      }

      // Safely check result properties
      const resultData = functionResponse.data;
      if (!isObject(resultData)) {
        return { 
          hasFine: false, 
          validationSuccessful: false,
          message: 'Invalid validation result'
        };
      }

      return {
        hasFine: resultData.hasFine === true,
        amount: resultData.amount || 0,
        validationDate: resultData.validationDate || new Date().toISOString(),
        validationSuccessful: true,
        recordId: insertResponse.data[0]?.id
      };
    },
    onSuccess: (data) => {
      if (data.validationSuccessful) {
        toast.success(data.hasFine 
          ? `Validation completed: Fine found (${data.amount} QAR)` 
          : 'Validation completed: No fines found');
      } else {
        toast.info('Validation completed, but results are inconclusive');
      }
    },
    onError: (error: Error) => {
      toast.error(`Validation failed: ${error.message}`);
    }
  });

  return {
    validateFine: validateFine.mutateAsync,
    isValidating: validateFine.isPending,
    validationError: validateFine.error
  };
}
