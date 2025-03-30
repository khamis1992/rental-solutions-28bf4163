
import { useState, useCallback, useEffect } from 'react';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePaymentGeneration = (agreement: Agreement | null, agreementId: string | undefined) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to refresh agreement data
  const refreshAgreementData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Custom function for handling special agreement payments - can be expanded later
  const handleSpecialAgreementPayments = useCallback(async (amount: number, paymentDate: Date, description?: string) => {
    if (!agreement || !agreementId) {
      toast.error("Agreement information is missing");
      return false;
    }
    
    try {
      // Form the payment record
      const paymentRecord = {
        lease_id: agreementId,
        amount: amount,
        payment_date: paymentDate.toISOString(),
        payment_method: 'cash', // Default to cash, can be made configurable
        description: description || `Monthly rent payment for ${agreement.agreement_number}`,
        status: 'completed',
        type: 'Income'
      };
      
      // Insert the payment record
      const { data, error } = await supabase
        .from('unified_payments')
        .insert(paymentRecord)
        .select('id')
        .single();
      
      if (error) {
        console.error("Payment recording error:", error);
        toast.error("Failed to record payment");
        return false;
      }
      
      toast.success("Payment recorded successfully");
      refreshAgreementData();
      return true;
    } catch (error) {
      console.error("Unexpected error recording payment:", error);
      toast.error("An unexpected error occurred while recording payment");
      return false;
    }
  }, [agreement, agreementId, refreshAgreementData]);

  return {
    refreshTrigger,
    refreshAgreementData,
    handleSpecialAgreementPayments
  };
};
