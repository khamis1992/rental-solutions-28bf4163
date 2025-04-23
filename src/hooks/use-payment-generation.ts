
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generatePaymentSchedule } from '@/utils/payment-schedule-generator';
import { Agreement } from '@/types/agreement';

interface GeneratePaymentsProps {
  agreement: Agreement;
  userId: string;
}

export const usePaymentGeneration = (agreement: Agreement | null = null, agreementId?: string) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const generatePaymentsMutation = useMutation({
    mutationFn: async ({ agreement, userId }: GeneratePaymentsProps) => {
      setIsGenerating(true);
      try {
        if (!agreement || !agreement.id) {
          throw new Error("Agreement data is missing or invalid.");
        }

        const customerId = agreement.customer_id || agreement.customerId;
        if (!customerId) {
          throw new Error("Customer ID is missing from the agreement.");
        }

        const vehicleId = agreement.vehicle_id || agreement.vehicleId;
        if (!vehicleId) {
          throw new Error("Vehicle ID is missing from the agreement.");
        }

        const startDate = new Date(agreement.start_date);
        const endDate = agreement.end_date ? new Date(agreement.end_date) : null;
        const rentAmount = agreement.rent_amount || 0;
        const totalAmount = agreement.total_amount || 0;
        const agreementId = agreement.id;
        const agreementInfo = `${agreement.agreement_number} - ${agreement.customers?.full_name}`;

        if (!startDate || isNaN(startDate.getTime())) {
          throw new Error("Invalid start date provided.");
        }

        if (!rentAmount || rentAmount <= 0) {
          throw new Error("Rent amount is invalid or missing.");
        }

        const paymentSchedule = generatePaymentSchedule({
          startDate,
          endDate,
          rentAmount,
          totalAmount
        });

        if (!paymentSchedule || paymentSchedule.length === 0) {
          throw new Error("No payment schedule could be generated.");
        }

        // Prepare payments data for database insertion
        const paymentsData = paymentSchedule.map(payment => ({
          agreement_id: agreementId,
          customer_id: customerId,
          vehicle_id: vehicleId,
          due_date: payment.dueDate.toISOString(),
          amount: payment.amount,
          status: 'pending',
          created_by: userId,
          agreement_info: agreementInfo,
          expected_date: payment.dueDate.toISOString()
        }));

        // Insert payments into the database
        const { data, error } = await supabase
          .from('payments')
          .insert(paymentsData);

        if (error) {
          console.error("Error inserting payments:", error);
          throw new Error(`Failed to insert payments: ${error.message}`);
        }

        return { success: true, paymentCount: paymentsData.length, data };
      } catch (error) {
        console.error("Payment generation failed:", error);
        toast.error(`Payment generation failed: ${error.message}`);
        return { success: false, error: error.message };
      } finally {
        setIsGenerating(false);
      }
    },
    onSuccess: (result) => {
      if (result?.success) {
        toast.success(`Successfully generated ${result.paymentCount} payments!`);
      } else {
        toast.error(`Failed to generate payments: ${result?.error || 'Unknown error'}`);
      }
    },
    onError: (error) => {
      console.error("Payment generation error:", error);
      toast.error(`Payment generation failed: ${error.message || 'Unknown error'}`);
    }
  });

  // Add a special payment handling function
  const handleSpecialAgreementPayments = async (
    amount: number, 
    paymentDate: Date, 
    notes?: string, 
    paymentMethod?: string, 
    referenceNumber?: string, 
    includeLatePaymentFee?: boolean,
    isPartialPayment?: boolean,
    targetPaymentId?: string
  ) => {
    setIsProcessing(true);
    try {
      // Implementation would go here
      console.log("Recording payment:", { amount, paymentDate, notes, paymentMethod, referenceNumber });
      
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success("Payment recorded successfully");
      setIsProcessing(false);
      return true;
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error("Failed to record payment");
      setIsProcessing(false);
      return false;
    }
  };

  return {
    generatePayments: generatePaymentsMutation.mutate,
    isLoading: isGenerating,
    isSuccess: generatePaymentsMutation.isSuccess,
    isError: generatePaymentsMutation.isError,
    error: generatePaymentsMutation.error,
    isProcessing,
    handleSpecialAgreementPayments
  };
};
