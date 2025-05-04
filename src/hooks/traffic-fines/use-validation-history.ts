
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useErrorNotification } from '@/hooks/use-error-notification';
import { ApiValidationResult } from './types';

/**
 * Hook for accessing traffic fine validation history
 */
export const useValidationHistory = () => {
  const errorNotification = useErrorNotification();

  // Fetch validation history
  const { 
    data: validationHistory, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['trafficFineValidations'],
    queryFn: async (): Promise<ApiValidationResult[]> => {
      try {
        const { data, error } = await supabase
          .from('traffic_fine_validations')
          .select('*')
          .order('validation_date', { ascending: false })
          .limit(20);

        if (error) {
          const errorMessage = `Failed to fetch validation history: ${error.message}`;
          errorNotification.showError('Validation History Error', {
            description: errorMessage,
            id: 'validation-history-error'
          });
          throw new Error(errorMessage);
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

  return {
    validationHistory,
    isLoading,
    error
  };
};
