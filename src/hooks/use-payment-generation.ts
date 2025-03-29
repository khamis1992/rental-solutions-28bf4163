
import { useState, useCallback, useEffect } from 'react';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePaymentGeneration = (agreement: Agreement | null, agreementId: string | undefined) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);

  // Function to refresh agreement data
  const refreshAgreementData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Function to generate a payment for the current month
  const generateMonthlyPayment = useCallback(async () => {
    if (!agreementId || !agreement) {
      toast.error("Cannot generate payment: Missing agreement information");
      return;
    }

    setIsGeneratingPayment(true);
    
    try {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      const { data: lease, error: leaseError } = await supabase
        .from("leases")
        .select("rent_amount, agreement_number, status")
        .eq("id", agreementId)
        .single();
      
      if (leaseError) {
        console.error("Error fetching lease data:", leaseError);
        toast.error("Failed to fetch lease data");
        return;
      }
      
      if (!lease) {
        toast.error("Lease information not found");
        return;
      }
      
      if (lease.status !== 'active') {
        toast.error(`Cannot generate payment: Lease is not active (${lease.status})`);
        return;
      }
      
      // Create payment date for 1st of the current month
      const paymentDate = new Date(currentYear, currentMonth, 1);
      
      // Check if there's already a payment for this month
      const { data: existingPayments, error: checkError } = await supabase
        .from("unified_payments")
        .select("id")
        .eq("lease_id", agreementId)
        .gte("payment_date", new Date(currentYear, currentMonth, 1).toISOString())
        .lt("payment_date", new Date(currentYear, currentMonth + 1, 1).toISOString());
      
      if (checkError) {
        console.error("Error checking existing payments:", checkError);
        toast.error("Failed to check existing payments");
        return;
      }
      
      if (existingPayments && existingPayments.length > 0) {
        toast.info(`Payment already exists for ${paymentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`);
        return;
      }
      
      toast.loading(`Generating payment for ${paymentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`);
      
      // Create pending payment record
      const { data, error } = await supabase.from("unified_payments").insert({
        lease_id: agreementId,
        amount: lease.rent_amount,
        amount_paid: 0,
        balance: lease.rent_amount,
        payment_date: paymentDate.toISOString(),
        status: "pending",
        type: "Income",
        description: `Monthly rent payment for ${paymentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
        original_due_date: paymentDate.toISOString(),
      }).select();
      
      if (error) {
        console.error("Error generating payment:", error);
        toast.error("Failed to generate payment");
        return;
      }
      
      toast.success(`Payment generated successfully for ${paymentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`);
      refreshAgreementData();
    } catch (error) {
      console.error("Error in payment generation:", error);
      toast.error("An unexpected error occurred while generating payment");
    } finally {
      setIsGeneratingPayment(false);
    }
  }, [agreementId, agreement, refreshAgreementData]);

  // Custom function for handling special agreement payments
  const handleSpecialAgreementPayments = useCallback(async (agreement: Agreement, rentAmount: number) => {
    if (!agreement || !rentAmount) return;
    
    // This function can be expanded if special payment handling is needed
    console.log("Special agreement handling triggered", agreement.agreement_number, rentAmount);
    
    // Special processing can be added here if needed
  }, []);

  return {
    refreshTrigger,
    refreshAgreementData,
    generateMonthlyPayment,
    isGeneratingPayment,
    handleSpecialAgreementPayments
  };
};
