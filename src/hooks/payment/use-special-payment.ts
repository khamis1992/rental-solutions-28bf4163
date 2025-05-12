
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { createPaymentUpdate, createPaymentInsert, asLeaseId } from '@/utils/type-adapters';
import { PaymentStatus } from '@/types/payment.types';

interface SpecialPaymentParams {
  agreementId: string;
  amount: number;
  paymentDate: Date;
  options?: {
    notes?: string;
    paymentMethod?: string;
    referenceNumber?: string;
    includeLatePaymentFee?: boolean;
    isPartialPayment?: boolean;
    paymentType?: string;
    targetPaymentId?: string;
  };
}

/**
 * Hook for handling special payment scenarios
 * This includes partial payments, late fees, etc.
 */
export function useSpecialPayment() {
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  
  const specialPaymentMutation = useMutation({
    mutationFn: async ({ agreementId, amount, paymentDate, options }: SpecialPaymentParams) => {
      if (!agreementId) throw new Error("Agreement ID is required");
      
      // Safe type casting for database ID
      const safeLeaseId = asLeaseId(agreementId);
      
      try {
        // Check if this is a payment for an existing record
        if (options?.targetPaymentId) {
          // Get existing payment details
          const { data: existingPayment, error: paymentError } = await supabase
            .from('unified_payments')
            .select('*')
            .eq('id', options.targetPaymentId)
            .single();
            
          if (paymentError || !existingPayment) {
            throw new Error(`Error fetching payment: ${paymentError?.message || 'No payment found'}`);
          }
          
          // Calculate new balance and status
          const totalPaid = (existingPayment.amount_paid || 0) + amount;
          const newBalance = existingPayment.amount - totalPaid;
          const newStatus = newBalance <= 0 ? 'completed' as PaymentStatus : 'partially_paid' as PaymentStatus;
          
          // Create type-safe update object
          const updateData = createPaymentUpdate({
            amount_paid: totalPaid,
            balance: Math.max(0, newBalance),
            status: newStatus,
            payment_date: paymentDate.toISOString(),
            payment_method: options.paymentMethod,
            reference_number: options.referenceNumber
          });
          
          // Update the existing payment
          const { error: updateError } = await supabase
            .from('unified_payments')
            .update(updateData)
            .eq('id', options.targetPaymentId);
            
          if (updateError) {
            throw new Error(`Error updating payment: ${updateError.message}`);
          }
          
          return { 
            success: true, 
            message: `Payment ${newStatus === 'completed' ? 'completed' : 'partially recorded'} successfully` 
          };
        }
        
        // Handle payment with or without late fee
        // Get agreement details to check daily late fee
        const { data: leaseData, error: leaseError } = await supabase
          .from('leases')
          .select('daily_late_fee, rent_amount')
          .eq('id', safeLeaseId)
          .single();
          
        if (leaseError || !leaseData) {
          throw new Error(`Error fetching agreement: ${leaseError?.message || 'Agreement not found'}`);
        }
        
        // Calculate late fee if applicable
        const dailyLateFee = leaseData.daily_late_fee || 120; // Default to 120 QAR if not specified
        const dueDate = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1);
        const isLate = paymentDate.getDate() > 1;
        const daysLate = isLate ? paymentDate.getDate() - 1 : 0;
        const lateFeeAmount = isLate ? Math.min(daysLate * dailyLateFee, 3000) : 0; // Cap at 3000 QAR
        
        // Handle partial payment if selected
        const isPartial = options?.isPartialPayment || false;
        const rentAmount = leaseData.rent_amount || 0;
        let paymentStatus: PaymentStatus = 'completed';
        let balance = 0;
        
        if (isPartial && amount < rentAmount) {
          paymentStatus = 'partially_paid';
          balance = rentAmount - amount;
        }
        
        // Create type-safe insert object for the payment
        const paymentData = createPaymentInsert({
          lease_id: safeLeaseId,
          amount: rentAmount,
          amount_paid: amount,
          balance: balance,
          payment_date: paymentDate.toISOString(),
          payment_method: options?.paymentMethod,
          reference_number: options?.referenceNumber,
          description: options?.notes || `Payment for ${paymentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
          status: paymentStatus,
          type: options?.paymentType || 'Income',
          days_overdue: daysLate,
          late_fine_amount: options?.includeLatePaymentFee ? lateFeeAmount : 0,
          original_due_date: dueDate.toISOString()
        });
        
        // Insert the payment record
        const { error: insertError } = await supabase
          .from('unified_payments')
          .insert([paymentData]);
          
        if (insertError) {
          throw new Error(`Error recording payment: ${insertError.message}`);
        }
        
        // Create separate late fee record if requested
        if (options?.includeLatePaymentFee && lateFeeAmount > 0) {
          const lateFeeData = createPaymentInsert({
            lease_id: safeLeaseId,
            amount: lateFeeAmount,
            amount_paid: lateFeeAmount,
            balance: 0,
            payment_date: paymentDate.toISOString(),
            payment_method: options.paymentMethod,
            reference_number: options.referenceNumber,
            description: `Late fee for ${paymentDate.toLocaleString('default', { month: 'long', year: 'numeric' })} (${daysLate} days late)`,
            status: 'completed',
            type: 'LATE_PAYMENT_FEE',
            late_fine_amount: lateFeeAmount,
            days_overdue: daysLate,
            original_due_date: dueDate.toISOString()
          });
          
          const { error: lateFeeError } = await supabase
            .from('unified_payments')
            .insert([lateFeeData]);
            
          if (lateFeeError) {
            throw new Error(`Error recording late fee: ${lateFeeError.message}`);
          }
        }
        
        return { success: true, message: 'Payment recorded successfully' };
      } catch (error) {
        console.error("Error in specialPaymentMutation:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Payment processed successfully');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error) => {
      toast.error(`Payment error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  const handleSpecialPayment = async (params: SpecialPaymentParams) => {
    setIsPending(true);
    try {
      return await specialPaymentMutation.mutateAsync(params);
    } finally {
      setIsPending(false);
    }
  };

  return {
    handleSpecialPayment,
    isPending
  };
}
