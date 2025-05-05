
import React from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { agreementService } from '@/services/AgreementService';

// Updated type declaration for validation result with proper conditional type
type ValidationResult = 
  | { success: true; data: Agreement }
  | { success: false; error?: Error; errors: Record<string, string> };

interface AgreementSubmitHandlerProps {
  children: React.ReactNode;
  onSubmit?: (data: Agreement) => void;
  redirectTo?: string;
}

export const AgreementSubmitHandler: React.FC<AgreementSubmitHandlerProps> = ({
  children,
  onSubmit,
  redirectTo = '/agreements',
}) => {
  const navigate = useNavigate();

  const handleSubmit = async (formData: Agreement) => {
    try {
      // Validate form data
      const validationResult = validateAgreementData(formData) as ValidationResult;
      
      if (!validationResult.success) {
        // Type guard to ensure errors exists on the validation result
        if ('errors' in validationResult) {
          // Show validation errors
          const firstErrorKey = Object.keys(validationResult.errors)[0];
          const errorMessage = validationResult.errors[firstErrorKey];
          toast.error(errorMessage);
        } else {
          toast.error("Validation failed");
        }
        return;
      }
      
      // Save agreement
      const saveResult = await agreementService.save(validationResult.data);
      
      if (!saveResult.success) {
        // Handle API errors
        if ('error' in saveResult) { 
          toast.error(saveResult.error?.toString() || "Failed to save agreement");
        } else {
          toast.error("Failed to save agreement");
        }
        return;
      }
      
      // Success handling
      toast.success('Agreement created successfully');
      
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
    }
  };

  return (
    <div>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            onSubmit: handleSubmit
          });
        }
        return child;
      })}
    </div>
  );
};

// Updated validation function that returns the correct type
function validateAgreementData(data: any): ValidationResult {
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
