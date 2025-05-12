
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { agreementService } from '@/services/AgreementService';
import { adaptAgreementForValidation } from '@/utils/type-adapters';
import { showSuccessToast, showErrorToast } from '@/utils/toast-utils';

// Updated type declaration for validation result with proper conditional type
type ValidationResult = 
  | { success: true; data: Agreement }
  | { success: false; error?: Error; errors: Record<string, string> };

interface AgreementSubmitHandlerProps {
  children: (props: {
    handleSubmit: (data: Agreement) => Promise<void>;
    isSubmitting: boolean;
    updateProgress?: (progress: number) => void;
    validationErrors?: Record<string, string> | null;
  }) => React.ReactNode;
  id?: string;
  agreement?: Agreement;
  userId?: string;
  onSubmit?: (data: Agreement) => void;
  redirectTo?: string;
}

export const AgreementSubmitHandler: React.FC<AgreementSubmitHandlerProps> = ({
  children,
  onSubmit,
  redirectTo = '/agreements',
}) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string> | null>(null);
  const [updateProgress, setUpdateProgress] = useState<number>(0);

  // Memoize handleSubmit to prevent recreations
  const handleSubmit = useCallback(async (formData: Agreement) => {
    try {
      setIsSubmitting(true);
      setValidationErrors(null);
      setUpdateProgress(10);
      
      // Convert the model agreement to validation-compatible agreement
      const adaptedData = adaptAgreementForValidation(formData);
      
      // Validate form data
      const validationResult = validateAgreementData(adaptedData) as ValidationResult;
      setUpdateProgress(30);
      
      if (!validationResult.success) {
        // Type guard to ensure errors exists on the validation result
        if ('errors' in validationResult) {
          // Show validation errors
          setValidationErrors(validationResult.errors);
          const firstErrorKey = Object.keys(validationResult.errors)[0];
          const errorMessage = validationResult.errors[firstErrorKey];
          showErrorToast(errorMessage);
        } else {
          showErrorToast("Validation failed");
        }
        setUpdateProgress(0);
        return;
      }
      
      setUpdateProgress(50);
      
      // Ensure proper typing between API types and UI types
      const apiCompatibleData = mapToApiCompatibleAgreement(validationResult.data);
      
      // Save agreement
      const saveResult = await agreementService.save(apiCompatibleData);
      
      setUpdateProgress(80);
      
      if (!saveResult.success) {
        // Handle API errors
        if ('error' in saveResult) { 
          showErrorToast(saveResult.error?.toString() || "Failed to save agreement");
        } else {
          showErrorToast("Failed to save agreement");
        }
        setUpdateProgress(0);
        return;
      }
      
      setUpdateProgress(100);
      
      // Success handling
      showSuccessToast('Agreement saved successfully');
      
      // Custom callback if provided
      if (onSubmit) {
        onSubmit(validationResult.data);
      }
      
      // Redirect if specified
      if (redirectTo) {
        navigate(redirectTo);
      }
    } catch (error) {
      console.error("Error submitting agreement:", error);
      showErrorToast("An unexpected error occurred");
      setUpdateProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, redirectTo, navigate]); // Only depend on callback functions and navigation

  return (
    <div>
      {children({
        handleSubmit,
        isSubmitting,
        updateProgress: (progress) => setUpdateProgress(progress),
        validationErrors
      })}
    </div>
  );
};

// Helper function to ensure API compatibility between UI types and API types
function mapToApiCompatibleAgreement(data: Agreement): Agreement {
  // Make a copy to avoid modifying the original
  const apiData = { ...data };
  
  // Fix incompatible types by mapping statuses
  // If the status is 'completed', map it to 'closed' for compatibility
  if (apiData.status === 'completed') {
    apiData.status = 'closed';
  }
  
  return apiData;
}

// Updated validation function that returns the correct type
function validateAgreementData(data: Agreement): ValidationResult {
  // Implement validation logic here
  const errors: Record<string, string> = {};
  
  // Example validations
  if (!data.customer_id) {
    errors.customer_id = 'Customer is required';
  }
  
  if (!data.vehicle_id) {
    errors.vehicle_id = 'Vehicle is required';
  }
  
  if (!data.start_date) {
    errors.start_date = 'Start date is required';
  }
  
  if (!data.end_date) {
    errors.end_date = 'End date is required';
  }

  // Ensure total_amount is present and valid
  if (data.total_amount === undefined || data.total_amount === null) {
    errors.total_amount = 'Total amount is required';
    data.total_amount = 0; // Provide a default value
  }
  
  // Return validation result
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }
  
  return { success: true, data };
}
