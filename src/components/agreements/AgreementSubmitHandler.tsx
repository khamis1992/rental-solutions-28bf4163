
import React from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { AgreementService } from '@/services/AgreementService';

// Type declaration for validation result
type ValidationResult = 
  | { success: true; data: Agreement }
  | { success: false; errors: Record<string, string> };

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
        // Show validation errors
        const firstErrorKey = Object.keys(validationResult.errors)[0];
        const errorMessage = validationResult.errors[firstErrorKey];
        toast.error(errorMessage);
        return;
      }
      
      // Save agreement
      const saveResult = await AgreementService.save(validationResult.data);
      
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

// Validation function
function validateAgreementData(data: any): ValidationResult {
  // Implement validation logic here
  // For now, we'll return a success result
  return { success: true, data };
}
