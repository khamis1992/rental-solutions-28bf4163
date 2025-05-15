import React, { useCallback, useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Agreement } from '@/types/agreement';
import { useAgreementService } from '@/hooks/services/useAgreementService';

// Define props interface
interface AgreementSubmitHandlerProps {
  agreement: Agreement;
  isSubmitting?: boolean;
  onSubmitStart?: () => void;
  onSubmitEnd?: (success: boolean) => void;
  redirectUrl?: string;
  submitButtonText?: string;
  submitButtonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  disabled?: boolean;
}

export const AgreementSubmitHandler: React.FC<AgreementSubmitHandlerProps> = ({
  agreement,
  isSubmitting: externalIsSubmitting,
  onSubmitStart,
  onSubmitEnd,
  redirectUrl = '/agreements',
  submitButtonText = 'Save Agreement',
  submitButtonVariant = 'default',
  disabled = false,
}) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { save, updateAgreement, createAgreement } = useAgreementService();

  const handleSave = useCallback(async () => {
    try {
      // Use external submitting state if provided, otherwise manage internal state
      if (!externalIsSubmitting) setIsSubmitting(true);
      if (onSubmitStart) onSubmitStart();
      
      // Check for required fields
      if (!agreement.customer_id || !agreement.vehicle_id) {
        throw new Error('Customer and vehicle are required');
      }

      let savedAgreement;
      if (agreement.id) {
        savedAgreement = await updateAgreement(agreement);
      } else {
        savedAgreement = await createAgreement(agreement);
      }

      if (!savedAgreement) {
        throw new Error('Failed to save agreement');
      }

      toast.success('Agreement saved successfully');
      
      if (redirectUrl) {
        navigate(redirectUrl);
      }
      
      if (onSubmitEnd) onSubmitEnd(true);
      return true;
    } catch (error) {
      console.error('Error saving agreement:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(`Failed to save agreement: ${errorMessage}`);
      if (onSubmitEnd) onSubmitEnd(false);
      return false;
    } finally {
      if (!externalIsSubmitting) setIsSubmitting(false);
    }
  }, [agreement, redirectUrl, onSubmitStart, onSubmitEnd, externalIsSubmitting, navigate, updateAgreement, createAgreement]);
  
  return (
    <Button
      onClick={handleSave}
      disabled={disabled || isSubmitting || externalIsSubmitting}
      variant={submitButtonVariant}
    >
      {isSubmitting || externalIsSubmitting ? 'Saving...' : submitButtonText}
    </Button>
  );
};
