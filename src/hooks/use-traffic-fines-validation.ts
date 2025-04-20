
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface ValidationResult {
  id: string;
  license_plate: string;
  validation_date: string;
  validation_source: string;
  result: any;
  status: string;
  error_message?: string;
}

export interface ValidationAttempt {
  id: string;
  license_plate: string;
  attempt_count: number;
  last_attempt_date: string;
}

export const useTrafficFinesValidation = () => {
  const [isValidating, setIsValidating] = useState(false);

  const { data: validationHistory, isLoading } = useQuery({
    queryKey: ['trafficFineValidations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('traffic_fine_validations')
        .select('*')
        .order('validation_date', { ascending: false });

      if (error) throw error;
      return data as ValidationResult[];
    }
  });

  const { data: validationAttempts } = useQuery({
    queryKey: ['validationAttempts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('traffic_fine_validation_attempts')
        .select('*');

      if (error) throw error;
      return data as ValidationAttempt[];
    }
  });

  const validateFine = useMutation({
    mutationFn: async ({ license_plate }: { license_plate: string }) => {
      setIsValidating(true);
      try {
        const { data: validation, error } = await supabase
          .from('traffic_fine_validations')
          .insert([{
            license_plate,
            validation_source: 'manual',
            result: { status: 'completed' },
            status: 'completed'
          }])
          .select()
          .single();

        if (error) throw error;
        return validation;
      } finally {
        setIsValidating(false);
      }
    },
    onSuccess: () => {
      toast.success('Traffic fine validation completed');
    },
    onError: (error) => {
      toast.error('Failed to validate traffic fine', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });

  return {
    validationHistory,
    validationAttempts,
    validateFine,
    isValidating,
    isLoading
  };
};
