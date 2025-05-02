
import { useState, useCallback } from 'react';

interface TrafficFineData {
  violationNumber?: string;
  licensePlate?: string;
  violationDate?: Date | null;
  fineAmount?: number | null;
  violationCharge?: string;
  location?: string;
  paymentStatus?: string;
}

interface ValidationErrors {
  licensePlate?: string;
  violationDate?: string;
  fineAmount?: string;
}

export function useTrafficFineValidation() {
  const [data, setData] = useState<TrafficFineData>({
    violationNumber: '',
    licensePlate: '',
    violationDate: null,
    fineAmount: null,
    violationCharge: '',
    location: '',
    paymentStatus: 'pending'
  });
  
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isDirty, setIsDirty] = useState(false);
  
  const validateField = useCallback((field: keyof TrafficFineData, value: any): string | undefined => {
    switch (field) {
      case 'licensePlate':
        if (!value || value.trim() === '') {
          return 'License plate is required';
        }
        break;
      
      case 'violationDate':
        if (!value) {
          return 'Violation date is required';
        }
        
        // Check if date is in the future
        const currentDate = new Date();
        currentDate.setHours(23, 59, 59, 999); // End of today
        
        if (value > currentDate) {
          return 'Violation date cannot be in the future';
        }
        break;
        
      case 'fineAmount':
        if (value === null || value === undefined) {
          return 'Fine amount is required';
        }
        
        if (isNaN(Number(value)) || Number(value) <= 0) {
          return 'Fine amount must be a positive number';
        }
        break;
    }
    
    return undefined;
  }, []);

  const updateField = useCallback((field: keyof TrafficFineData, value: any) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }));
    
    const error = validateField(field, value);
    
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
    
    setIsDirty(true);
  }, [validateField]);
  
  const validateAll = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;
    
    // Validate required fields
    const requiredFields: (keyof TrafficFineData)[] = ['licensePlate', 'violationDate', 'fineAmount'];
    
    requiredFields.forEach(field => {
      const error = validateField(field, data[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    setIsDirty(true);
    
    return isValid;
  }, [data, validateField]);
  
  const resetForm = useCallback(() => {
    setData({
      violationNumber: '',
      licensePlate: '',
      violationDate: null,
      fineAmount: null,
      violationCharge: '',
      location: '',
      paymentStatus: 'pending'
    });
    setErrors({});
    setIsDirty(false);
  }, []);
  
  const getFieldError = useCallback((field: keyof ValidationErrors) => {
    return errors[field];
  }, [errors]);
  
  return {
    data,
    errors,
    isDirty,
    isValid: Object.keys(errors).length === 0,
    updateField,
    validateField,
    validateAll,
    resetForm,
    getFieldError
  };
}
