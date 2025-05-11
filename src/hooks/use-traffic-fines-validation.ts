
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { isValidationAttempt, ValidationAttempt, ValidationResult } from '@/types/validation-types';
import { createPaymentInsert } from '@/utils/type-adapters';

// Default values for form fields
const DEFAULT_VALUES = {
  licensePlate: '',
  validationSource: 'MOI'
};

export const useTrafficFinesValidation = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<ValidationAttempt | null>(null);
  const [checkHistory, setCheckHistory] = useState<ValidationAttempt[]>([]);

  // Convert raw data to proper ValidationAttempt type
  const processValidationResult = (data: any): ValidationAttempt | null => {
    if (!data || !isValidationAttempt(data)) return null;
    
    return {
      id: data.id,
      license_plate: data.license_plate,
      validation_date: data.validation_date,
      status: data.status,
      result: data.result || null,
      error_message: data.error_message || null
    };
  };

  // Load validation history for a license plate
  const loadValidationHistory = useCallback(async (licensePlate: string) => {
    if (!licensePlate) return [];
    
    try {
      const { data, error } = await supabase
        .from('traffic_fine_validations')
        .select('*')
        .eq('license_plate', licensePlate)
        .order('validation_date', { ascending: false })
        .limit(5);
        
      if (error) throw error;
      
      if (!data) return [];
      
      // Convert data to proper format
      const history = data.map(item => processValidationResult(item)).filter(Boolean) as ValidationAttempt[];
      setCheckHistory(history);
      return history;
    } catch (error) {
      console.error('Error loading validation history:', error);
      return [];
    }
  }, []);

  // Check for traffic fines for a license plate
  const checkTrafficFines = useCallback(async (licensePlate: string): Promise<ValidationResult> => {
    if (!licensePlate) {
      toast.error('Please enter a license plate');
      return { success: false, error: 'No license plate provided' };
    }
    
    setIsChecking(true);
    
    try {
      // First, load history to see if there are recent checks
      const history = await loadValidationHistory(licensePlate);
      
      // Create validation record
      const currentDate = new Date().toISOString();
      const validationData = {
        license_plate: licensePlate,
        validation_date: currentDate,
        result: {},
        status: 'completed'
      };
      
      const { data, error } = await supabase
        .from('traffic_fine_validations')
        .insert(validationData)
        .select()
        .single();
      
      if (error) throw error;
      
      // Process the result into the correct type
      const validationResult = processValidationResult(data);
      
      if (!validationResult) {
        throw new Error('Failed to process validation result');
      }
      
      // Update state
      setLastAttempt(validationResult);
      
      // Update history
      setCheckHistory([validationResult, ...checkHistory]);
      
      return { success: true, data: validationResult };
    } catch (error) {
      console.error('Error checking traffic fines:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Error: ${errorMessage}`);
      return { success: false, error };
    } finally {
      setIsChecking(false);
    }
  }, [checkHistory, loadValidationHistory]);

  return {
    isChecking,
    lastAttempt,
    checkHistory,
    checkTrafficFines,
    loadValidationHistory,
    defaultValues: DEFAULT_VALUES
  };
};
