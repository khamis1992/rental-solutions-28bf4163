
import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// Export the interface so it can be used in other components
export interface ValidationResult {
  validation_date: string;
  result: {
    has_fine?: boolean;
    details?: string;
  };
  status: string;
  error_message?: string;
  license_plate: string;
  fine_id?: string;
}

export function useTrafficFinesValidation() {
  const validateLicensePlate = useCallback(async (licenseNumber: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('validate-traffic-fines', {
        body: { license_plate: licenseNumber },
      });

      if (error) {
        console.error('Function invocation error:', error);
        return {
          hasFine: false,
          details: 'Error validating license plate',
          status: 'error',
        };
      }

      if (data?.hasFine) {
        // Store the validation result in the database
        const { error: insertError } = await supabase
          .from('traffic_fine_validations')
          .insert([
            {
              license_plate: licenseNumber,
              validation_date: new Date().toISOString(),
              result: { has_fine: data.hasFine, details: data.details },
              status: 'success',
            },
          ]);

        if (insertError) {
          console.error('Error inserting validation result:', insertError);
        }

        return {
          hasFine: data.hasFine,
          details: data.details,
          status: 'success',
        };
      } else {
        // Store the validation result in the database
        const { error: insertError } = await supabase
          .from('traffic_fine_validations')
          .insert([
            {
              license_plate: licenseNumber,
              validation_date: new Date().toISOString(),
              result: { has_fine: false, details: 'No fines found' },
              status: 'success',
            },
          ]);

        if (insertError) {
          console.error('Error inserting validation result:', insertError);
        }

        return {
          hasFine: false,
          details: 'No fines found',
          status: 'success',
        };
      }
    } catch (error: any) {
      console.error('Error validating license plate:', error);
      return {
        hasFine: false,
        details: 'Error validating license plate',
        status: 'error',
      };
    }
  }, []);

  const checkValidationResult = useCallback(async (licenseNumber: string) => {
    try {
      const { data, error } = await supabase
        .from('traffic_fine_validations')
        .select('*')
        .eq('license_plate', licenseNumber)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (data?.result) {
        return {
          hasFine: (data.result as ValidationResult['result']).has_fine,
          details: (data.result as ValidationResult['result']).details,
          status: data.status
        };
      }

      return null;
    } catch (error) {
      console.error('Error checking validation result:', error);
      return null;
    }
  }, []);

  return { validateLicensePlate, checkValidationResult };
}
