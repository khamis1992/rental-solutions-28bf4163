
import React from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Agreement } from '@/types/agreement';
import { agreementService } from '@/services/AgreementService';
import { ensureValidationLeaseStatus } from '@/utils/database-type-helpers';

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
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string> | null>(null);
  const [updateProgress, setUpdateProgress] = React.useState<number>(0);

  const handleSubmit = async (formData: Agreement) => {
    try {
      setIsSubmitting(true);
      setValidationErrors(null);
      setUpdateProgress(10);
      
      // Convert the status to a validation-compatible status
      // This ensures 'completed' is mapped to an allowed status like 'closed'
      const updatedFormData = {
        ...formData,
        status: ensureValidationLeaseStatus(formData.status)
      } as any; // Use type assertion to bypass the type mismatch temporarily
      
      // Validate form data
      const validationResult = validateAgreementData(updatedFormData) as ValidationResult;
      setUpdateProgress(30);
      
      if (!validationResult.success) {
        // Type guard to ensure errors exists on the validation result
        if ('errors' in validationResult) {
          // Show validation errors
          setValidationErrors(validationResult.errors);
          const firstErrorKey = Object.keys(validationResult.errors)[0];
          const errorMessage = validationResult.errors[firstErrorKey];
          toast.error(errorMessage);
        } else {
          toast.error("Validation failed");
        }
        setUpdateProgress(0);
        return;
      }
      
      setUpdateProgress(50);
      
      // Save agreement
      const saveResult = await agreementService.save(validationResult.data);
      
      setUpdateProgress(80);
      
      if (!saveResult.success) {
        // Handle API errors
        if ('error' in saveResult) { 
          toast.error(saveResult.error?.toString() || "Failed to save agreement");
        } else {
          toast.error("Failed to save agreement");
        }
        setUpdateProgress(0);
        return;
      }
      
      setUpdateProgress(100);
      
      // Success handling
      toast.success('Agreement saved successfully');
      
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
      toast.error("An unexpected error occurred");
      setUpdateProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

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
  
  // Return validation result
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }
  
  return { success: true, data };
}
