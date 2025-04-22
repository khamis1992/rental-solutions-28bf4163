
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Agreement } from '@/types/agreement';

export const usePaymentGeneration = (agreement: Agreement | null, agreementId?: string) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const createPaymentSchedule = useCallback(async () => {
    if (!agreementId) {
      toast.error('No agreement ID provided');
      return false;
    }

    setIsGenerating(true);

    try {
      const { error } = await supabase.functions.invoke('generate-payment-schedule', {
        body: { agreementId }
      });

      if (error) {
        throw new Error(`Error generating payment schedule: ${error.message}`);
      }

      toast.success('Payment schedule generated successfully');
      return true;
    } catch (error) {
      console.error('Error in createPaymentSchedule:', error);
      toast.error(`Failed to generate payment schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, [agreementId]);

  const handlePayment = useCallback(async (
    amount: number,
    paymentDate: Date,
    notes?: string,
    paymentMethod?: string
  ) => {
    if (!agreementId) {
      toast.error('No agreement ID provided');
      return false;
    }

    try {
      const { error } = await supabase.from('unified_payments').insert({
        lease_id: agreementId,
        amount,
        payment_date: paymentDate.toISOString(),
        status: 'paid',
        description: notes || 'Rent payment',
        payment_method: paymentMethod || 'cash',
      });

      if (error) {
        throw error;
      }

      toast.success('Payment recorded successfully');
      return true;
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error(`Failed to record payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }, [agreementId]);

  const handleSpecialAgreementPayments = useCallback(async (
    amount: number,
    paymentDate: Date,
    notes?: string,
    paymentMethod?: string,
    referenceNumber?: string,
    includeLatePaymentFee?: boolean,
    isPartialPayment?: boolean
  ) => {
    if (!agreementId) {
      toast.error('No agreement ID provided');
      return false;
    }

    try {
      // First get any late fee information
      let lateFeeAmount = 0;
      
      if (includeLatePaymentFee && agreement && agreement.daily_late_fee) {
        // Calculate days late for the fee
        const today = new Date();
        const daysLate = today.getDate() - 1; // Assuming payment due on 1st
        if (daysLate > 0) {
          lateFeeAmount = Math.min(daysLate * agreement.daily_late_fee, 3000); // Cap at 3000
        }
      }
      
      // Create the payment record
      const { error } = await supabase.from('unified_payments').insert({
        lease_id: agreementId,
        amount,
        payment_date: paymentDate.toISOString(),
        status: 'paid',
        description: notes || (isPartialPayment ? 'Partial rent payment' : 'Rent payment'),
        payment_method: paymentMethod || 'cash',
        transaction_id: referenceNumber || undefined,
        late_fine_amount: lateFeeAmount > 0 ? lateFeeAmount : undefined,
      });

      if (error) {
        throw error;
      }

      // If this is a payment for an agreement with 'pending_payment' status, update the agreement
      if (agreement && agreement.status === 'pending_payment' && !isPartialPayment) {
        const { error: updateError } = await supabase
          .from('leases')
          .update({
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', agreementId);

        if (updateError) {
          console.error('Error updating agreement status:', updateError);
          // Don't block the payment though, just log it
        }
      }

      // If there was a late fee, create a separate record for it
      if (lateFeeAmount > 0) {
        await supabase.from('unified_payments').insert({
          lease_id: agreementId,
          amount: lateFeeAmount,
          payment_date: paymentDate.toISOString(),
          status: 'paid',
          description: 'Late payment fee',
          payment_method: paymentMethod || 'cash',
          transaction_id: referenceNumber ? `${referenceNumber}-latefee` : undefined,
        });
      }

      toast.success(lateFeeAmount > 0 
        ? `Payment recorded successfully (includes ${lateFeeAmount} QAR late fee)` 
        : 'Payment recorded successfully');
      
      return true;
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error(`Failed to record payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }, [agreement, agreementId]);

  return {
    createPaymentSchedule,
    handlePayment,
    handleSpecialAgreementPayments,
    isGenerating
  };
};
