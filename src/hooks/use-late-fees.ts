
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { handleLateFees } from '@/utils/payment-generation-utils';
import { format as dateFormat } from 'date-fns';

export const useLateFees = (agreementId?: string) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const recordLateFee = async (
    amount: number,
    daysLate: number,
    paymentDate: Date,
    paymentMethod: string,
    referenceNumber?: string
  ) => {
    try {
      const lateFeeRecord = {
        lease_id: agreementId,
        amount: amount,
        amount_paid: amount,
        balance: 0,
        payment_date: paymentDate.toISOString(),
        payment_method: paymentMethod,
        reference_number: referenceNumber || null,
        description: `Late payment fee for ${dateFormat(paymentDate, "MMMM yyyy")} (${daysLate} days late)`,
        status: 'completed',
        type: 'LATE_PAYMENT_FEE',
        late_fine_amount: amount,
        days_overdue: daysLate,
        original_due_date: new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1).toISOString()
      };
      
      const { error } = await supabase
        .from('unified_payments')
        .insert(lateFeeRecord);
      
      return !error;
    } catch (error) {
      console.error("Error recording late fee:", error);
      return false;
    }
  };

  return {
    recordLateFee,
    isProcessing
  };
};

