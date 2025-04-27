
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { useErrorTracking } from './use-error-tracking';
import { PaymentSubmitParams } from '@/components/agreements/AgreementDetail.types';
import { castDbId } from '@/utils/database-type-helpers';

export const usePaymentGeneration = (agreement: Agreement | null, agreementId?: string) => {
  const { trackError } = useErrorTracking();
  
  const handleSpecialAgreementPayments = useCallback(
    async (params: PaymentSubmitParams): Promise<boolean> => {
      const { 
        amount, 
        paymentDate, 
        notes, 
        paymentMethod, 
        referenceNumber, 
        includeLatePaymentFee, 
        isPartialPayment 
      } = params;
      
      if (!agreement || !agreementId) {
        toast.error('Cannot process payment: Agreement details are missing');
        return false;
      }

      try {
        const paymentData = {
          lease_id: agreementId,
          amount: amount,
          amount_paid: amount, // For completed payments, these are the same
          balance: 0, // Paid in full
          payment_date: paymentDate.toISOString(),
          status: 'completed',
          payment_method: paymentMethod || 'cash',
          description: notes || 'Monthly rent payment',
          type: 'rent',
          late_fine_amount: includeLatePaymentFee ? 120 : 0, // Default late fee
          days_overdue: 0,
          is_recurring: false,
          reference_number: referenceNumber
        };

        const { error } = await supabase
          .from('unified_payments')
          .insert(paymentData);

        if (error) {
          trackError(error, { paymentData }, 'handleSpecialAgreementPayments');
          toast.error(`Failed to record payment: ${error.message}`);
          return false;
        }

        // Update the lease's last_payment_date
        const { error: updateError } = await supabase
          .from('leases')
          .update({ 
            last_payment_date: paymentDate.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', castDbId(agreementId));

        if (updateError) {
          console.error('Error updating lease payment date:', updateError);
          // Not critical, so we don't return false here
        }

        return true;
      } catch (error) {
        trackError(error instanceof Error ? error : new Error('Unknown payment error'), 
          { agreementId, amount, paymentDate }, 'handleSpecialAgreementPayments');
        toast.error('An unexpected error occurred while recording payment');
        return false;
      }
    },
    [agreement, agreementId, trackError]
  );

  return {
    handleSpecialAgreementPayments
  };
};
