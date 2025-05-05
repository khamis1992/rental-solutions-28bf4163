
import React, { useState } from 'react';
import { Agreement } from '@/types/agreement';
import { updateAgreementWithCheck } from '@/utils/agreement-utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { validateData } from '@/lib/validation-utils';
import { agreementSchema } from '@/lib/validation-schemas/agreement';

interface AgreementSubmitHandlerProps {
  id: string;
  agreement: Agreement | null;
  userId?: string;
  children: (props: {
    handleSubmit: (updatedAgreement: Agreement) => Promise<void>;
    isSubmitting: boolean;
    updateProgress: string | null;
    validationErrors: Record<string, string> | null;
  }) => React.ReactNode;
}

export const AgreementSubmitHandler: React.FC<AgreementSubmitHandlerProps> = ({ 
  id, 
  agreement, 
  userId,
  children 
}) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string> | null>(null);

  const handleSubmit = async (updatedAgreement: Agreement) => {
    if (!id) return;
    
    // Reset validation errors
    setValidationErrors(null);
    
    // Validate the data before submitting
    const validationResult = validateData(agreementSchema, updatedAgreement);
    if (!validationResult.success) {
      setValidationErrors(validationResult.errors);
      
      // Show the first error in a toast
      const firstError = Object.values(validationResult.errors)[0];
      toast.error(firstError || "Please check the form for errors");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setUpdateProgress(null);
      
      // Check if the status is being changed to active or closed
      const isChangingToActive = updatedAgreement.status === 'active' && 
                              agreement?.status !== 'active';
      const isChangingToClosed = updatedAgreement.status === 'closed' && 
                              agreement?.status !== 'closed';
      
      // Set initial processing message
      if (isChangingToActive) {
        setUpdateProgress("Preparing to activate agreement...");
        toast.info("Activating agreement...");
      } else if (isChangingToClosed) {
        setUpdateProgress("Preparing to close agreement...");
        toast.info("Closing agreement...");
      } else {
        setUpdateProgress("Updating agreement...");
      }
      
      const { terms_accepted, additional_drivers, ...agreementData } = updatedAgreement;
      
      const updateData = {
        ...agreementData,
        id: id
      };
      
      // Use a timeout to handle potential hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Operation timed out")), 30000);
      });
      
      // Set up status update event handlers to track progress
      const statusUpdateCallback = (status: string) => {
        setUpdateProgress(status);
      };
      
      try {
        // Execute the operation with a timeout
        await Promise.race([
          updateAgreementWithCheck(
            { id, data: updateData },
            userId,
            () => {
              setUpdateProgress("Agreement updated successfully!");
              toast.success("Agreement updated successfully");
              navigate(`/agreements/${id}`);
            },
            (error: any) => {
              console.error("Error updating agreement:", error);
              setUpdateProgress(null);
              toast.error(`Failed to update: ${error.message || "Unknown error"}`);
              setIsSubmitting(false);
            },
            statusUpdateCallback // Pass the callback to track status updates
          ),
          timeoutPromise
        ]);
      } catch (timeoutError) {
        console.error("Operation timed out:", timeoutError);
        toast.error("Operation timed out. The system might still be processing your request.");
        setIsSubmitting(false);
        setUpdateProgress(null);
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast.error("Failed to update agreement");
      setIsSubmitting(false);
      setUpdateProgress(null);
    }
  };

  return (
    <>
      {children({
        handleSubmit,
        isSubmitting,
        updateProgress,
        validationErrors
      })}
    </>
  );
};
