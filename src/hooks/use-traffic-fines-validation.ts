
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ValidationResultType } from '@/components/fines/validation/types';

export type ValidationResult = ValidationResultType;

export function useTrafficFinesValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [validationHistory, setValidationHistory] = useState<ValidationResult[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const validateLicensePlate = async (licensePlate: string, source = 'manual') => {
    setIsValidating(true);
    
    try {
      // Simulate API call to validate traffic fine
      const validationDate = new Date();
      const hasFine = Math.random() > 0.5; // Simulate random result
      
      // Create the result
      const result: ValidationResult = {
        isValid: true,
        message: hasFine ? 'Traffic fine detected' : 'No traffic fine detected',
        licensePlate,
        validationDate,
        validationSource: source,
        hasFine,
        details: hasFine ? `Fine detected for license plate ${licensePlate}` : `No fines for ${licensePlate}`
      };

      // Record the validation in the database if needed
      const { data: validationRecord, error } = await supabase
        .from('traffic_fine_validations')
        .insert({
          license_plate: licensePlate,
          validation_source: source,
          result: {
            has_fine: hasFine,
            details: result.details
          },
          status: 'completed'
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error saving validation record:', error);
      } else if (validationRecord) {
        result.validationId = validationRecord.id;
      }

      setValidationResult(result);
      
      // Add to history
      setValidationHistory(prev => [result, ...prev]);
      
      return result;
    } catch (error) {
      console.error('Error validating license plate:', error);
      const errorResult: ValidationResult = {
        isValid: false,
        message: 'Failed to validate license plate',
        licensePlate,
        validationDate: new Date(),
        validationSource: source,
        hasFine: false,
        details: error instanceof Error ? error.message : 'Unknown error'
      };
      setValidationResult(errorResult);
      return errorResult;
    } finally {
      setIsValidating(false);
    }
  };

  const loadValidationHistory = async (licensePlate?: string) => {
    try {
      let query = supabase
        .from('traffic_fine_validations')
        .select('*')
        .order('validation_date', { ascending: false })
        .limit(10);
        
      if (licensePlate) {
        query = query.eq('license_plate', licensePlate);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error loading validation history:', error);
        return [];
      }
      
      // Map database records to validation result type
      const history: ValidationResult[] = (data || []).map(record => ({
        isValid: true,
        message: record.result?.has_fine ? 'Traffic fine detected' : 'No traffic fine detected',
        licensePlate: record.license_plate,
        validationDate: new Date(record.validation_date),
        validationSource: record.validation_source || 'system',
        hasFine: record.result?.has_fine || false,
        details: record.result?.details,
        validationId: record.id
      }));
      
      setValidationHistory(history);
      return history;
    } catch (error) {
      console.error('Error loading validation history:', error);
      return [];
    }
  };

  return {
    validateLicensePlate,
    isValidating,
    validationResult,
    validationHistory,
    loadValidationHistory
  };
}
