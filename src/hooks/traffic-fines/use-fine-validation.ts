
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useErrorNotification } from '@/hooks/use-error-notification';
import { ApiValidationResult, ValidationError, ValidationResult } from './types';
import { mapToValidationError } from './validation-errors';

/**
 * Hook for validating a single traffic fine
 */
export const useFineValidation = () => {
  const queryClient = useQueryClient();
  const errorNotification = useErrorNotification();
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  /**
   * Logs a validation attempt for a license plate
   */
  const incrementValidationAttempt = async (licensePlate: string) => {
    if (typeof licensePlate !== 'string' || !licensePlate.trim()) {
      throw new Error('Invalid license plate format');
    }

    try {
      const { data: existingValidations, error: queryError } = await supabase
        .from('traffic_fine_validations')
        .select('id, license_plate, validation_date, status')
        .eq('license_plate', licensePlate.trim())
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

  /**
   * Validate a traffic fine by license plate
   */
  const validateTrafficFine = async (licensePlate: string): Promise<ApiValidationResult> => {
    try {
      // Validate input
      if (!licensePlate || typeof licensePlate !== 'string' || !licensePlate.trim()) {
        throw new Error('Invalid license plate format');
      }

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

      // Ensure we have valid data that matches our ValidationResult interface
      const validationData = data as ApiValidationResult;

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
        errorNotification.showError('Validation Logging Error', {
          description: `Error logging validation: ${logError.message}`,
          id: 'validation-log-error'
        });
      }

      // Invalidate the query to refresh the validation history
      queryClient.invalidateQueries({ queryKey: ['trafficFineValidations'] });

      return validationData;
    } catch (error) {
      const validationError = mapToValidationError(error, licensePlate);

      // Store validation errors for later analysis
      setValidationErrors(prev => [...prev, validationError]);

      // Show notification for critical errors
      errorNotification.showError(`Validation Error: ${validationError.code}`, {
        description: validationError.message,
        id: `traffic-validation-${validationError.code}`
      });

      throw validationError;
    }
  };

  /**
   * Validates if a fine's date falls within the lease period
   */
  export const validateFineDate = (
    violationDate: Date, 
    leaseStartDate: string | Date | null, 
    leaseEndDate: string | Date | null
  ): { isValid: boolean; message: string } => {
    if (!violationDate) {
      return { isValid: false, message: 'No violation date provided' };
    }

    const fineDate = violationDate instanceof Date ? violationDate : new Date(violationDate);
    
    if (!leaseStartDate) {
      return { isValid: false, message: 'No lease start date provided' };
    }
    
    const startDate = leaseStartDate instanceof Date ? 
      leaseStartDate : new Date(leaseStartDate);
    
    // If no end date is provided, use current date (lease might still be active)
    const endDate = leaseEndDate ? 
      (leaseEndDate instanceof Date ? leaseEndDate : new Date(leaseEndDate)) : 
      new Date();
    
    const isValid = fineDate >= startDate && fineDate <= endDate;
    
    return {
      isValid,
      message: isValid ? 
        'Fine date is within lease period' : 
        'Fine date is outside the lease period'
    };
  };

  // Clear all validation errors
  const clearValidationErrors = () => {
    setValidationErrors([]);
  };

  return {
    validateTrafficFine,
    validateFineDate,
    validationErrors,
    clearValidationErrors
  };
};
