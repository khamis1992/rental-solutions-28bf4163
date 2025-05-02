
import { useState } from 'react';
import { 
  TrafficFineValidationResult, 
  TrafficFineValidationSchema, 
  validateTrafficFine 
} from '@/utils/validation/traffic-fine-validation';

/**
 * Custom hook for validating traffic fine data
 */
export const useTrafficFineValidation = (initialData?: TrafficFineValidationSchema) => {
  const [data, setData] = useState<TrafficFineValidationSchema>(initialData || {});
  const [validationResult, setValidationResult] = useState<TrafficFineValidationResult>({ 
    isValid: true, 
    errors: {} 
  });
  const [isDirty, setIsDirty] = useState<Record<string, boolean>>({});
  
  /**
   * Updates a field and validates it
   */
  const updateField = (field: keyof TrafficFineValidationSchema, value: any) => {
    const newData = { ...data, [field]: value };
    setData(newData);
    setIsDirty({ ...isDirty, [field]: true });
    
    // Validate the updated data
    const result = validateTrafficFine(newData);
    setValidationResult(result);
    
    return result.isValid;
  };
  
  /**
   * Validates all fields and marks them as dirty
   */
  const validateAll = (): boolean => {
    const result = validateTrafficFine(data);
    setValidationResult(result);
    
    // Mark all fields as dirty when doing a full validation
    const allDirty: Record<string, boolean> = {};
    Object.keys(data).forEach(key => {
      allDirty[key] = true;
    });
    setIsDirty(allDirty);
    
    return result.isValid;
  };
  
  /**
   * Gets the error message for a field if it's dirty and has an error
   */
  const getFieldError = (field: keyof TrafficFineValidationSchema): string | undefined => {
    if (isDirty[field] && validationResult.errors[field]) {
      return validationResult.errors[field];
    }
    return undefined;
  };
  
  /**
   * Resets the form state
   */
  const resetForm = (newData?: TrafficFineValidationSchema) => {
    setData(newData || {});
    setValidationResult({ isValid: true, errors: {} });
    setIsDirty({});
  };
  
  return {
    data,
    isValid: validationResult.isValid,
    errors: validationResult.errors,
    isDirty,
    updateField,
    validateAll,
    getFieldError,
    resetForm
  };
};
