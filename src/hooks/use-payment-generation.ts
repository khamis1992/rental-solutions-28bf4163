
import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { PaymentRecord, isPaymentRecord, isErrorResponse } from '@/types/payment-types';
import { useLoadingStates } from '@/hooks/payment/use-loading-states';
import { toast } from '@/components/ui/use-toast';

// Define loading states interface
interface PaymentGenerationLoadingStates {
  generating: boolean;
  retrieving: boolean;
  updating: boolean;
  recording: boolean;
}

export const usePaymentGeneration = () => {
  const [loadingStates, { setLoading, setIdle, isLoading }] = 
    useLoadingStates<PaymentGenerationLoadingStates>({
      generating: false,
      retrieving: false,
      updating: false,
      recording: false
    });
  
  // Safely get an existing payment record with error handling
  const getPaymentRecord = useCallback(async (paymentId: string): Promise<PaymentRecord | null> => {
    try {
      setLoading('retrieving');
      
      const { data, error } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('id', paymentId)
        .single();
        
      if (error) {
        console.error('Error fetching payment record:', error);
        toast({
          title: 'Error fetching payment',
          description: error.message,
          variant: 'destructive',
        });
        return null;
      }
      
      // Use type guard to verify the response structure
      if (!isPaymentRecord(data)) {
        console.error('Invalid payment record data format', data);
        return null;
      }
      
      return {
        id: data.id,
        lease_id: data.lease_id,
        amount: data.amount,
        amount_paid: data.amount_paid || 0,
        balance: data.balance || data.amount,
        payment_date: data.payment_date,
        payment_method: data.payment_method || '',
        reference_number: data.reference_number || '',
        description: data.description || '',
        status: data.status,
        type: data.type || 'regular',
        days_overdue: data.days_overdue || 0,
        late_fine_amount: data.late_fine_amount || 0,
        original_due_date: data.original_due_date || data.payment_date,
      };
    } catch (error) {
      console.error('Unexpected error retrieving payment:', error);
      return null;
    } finally {
      setIdle('retrieving');
    }
  }, [setLoading, setIdle]);
  
  // Get lease details (rent amount and late fee)
  const getLeaseDetails = useCallback(async (leaseId: string) => {
    try {
      const { data, error } = await supabase
        .from('leases')
        .select('daily_late_fee, rent_amount')
        .eq('id', leaseId)
        .single();
        
      if (error) {
        console.error('Error fetching lease details:', error);
        return { daily_late_fee: 0, rent_amount: 0 };
      }
      
      return {
        daily_late_fee: data.daily_late_fee || 0,
        rent_amount: data.rent_amount || 0
      };
    } catch (error) {
      console.error('Unexpected error fetching lease details:', error);
      return { daily_late_fee: 0, rent_amount: 0 };
    }
  }, []);

  // Record payment for an existing payment record
  const recordPayment = useCallback(async (
    paymentId: string, 
    paymentAmount: number, 
    paymentMethod: string,
    referenceNumber: string,
    paymentDate: string
  ) => {
    try {
      setLoading('recording');
      
      // Get the current payment record
      const paymentRecord = await getPaymentRecord(paymentId);
      if (!paymentRecord) {
        return { success: false, message: 'Payment record not found' };
      }
      
      // Calculate the new balance
      const previousAmountPaid = paymentRecord.amount_paid || 0;
      const newAmountPaid = previousAmountPaid + paymentAmount;
      const newBalance = paymentRecord.amount - newAmountPaid;
      
      // Determine the new status
      const newStatus = newBalance <= 0 ? 'paid' : 'partial';
      
      // Update the payment record
      const { error } = await supabase
        .from('unified_payments')
        .update({
          amount_paid: newAmountPaid,
          balance: newBalance,
          status: newStatus,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          reference_number: referenceNumber
        })
        .eq('id', paymentId);
        
      if (error) {
        console.error('Error recording payment:', error);
        return { success: false, message: error.message };
      }
      
      return { 
        success: true, 
        message: 'Payment recorded successfully',
        data: {
          amountPaid: newAmountPaid,
          balance: newBalance,
          status: newStatus
        }
      };
    } catch (error: any) {
      console.error('Unexpected error recording payment:', error);
      return { success: false, message: error.message || 'Failed to record payment' };
    } finally {
      setIdle('recording');
    }
  }, [getPaymentRecord, setLoading, setIdle]);
  
  // Create a new payment record
  const createPayment = useCallback(async ({
    leaseId,
    amount,
    paymentDate,
    paymentMethod = '',
    referenceNumber = '',
    description = '',
    status = 'pending',
    type = 'regular',
    daysOverdue = 0,
    originalDueDate
  }: {
    leaseId: string;
    amount: number;
    paymentDate: string;
    paymentMethod?: string;
    referenceNumber?: string;
    description?: string;
    status?: string;
    type?: string;
    daysOverdue?: number;
    originalDueDate?: string;
  }) => {
    try {
      setLoading('generating');
      
      // Get lease details for late fee calculation
      const leaseDetails = await getLeaseDetails(leaseId);
      
      // Calculate late fee if applicable
      const lateFineAmount = daysOverdue > 0 
        ? daysOverdue * (leaseDetails.daily_late_fee || 0)
        : 0;
      
      // Insert the payment record
      const { data, error } = await supabase
        .from('unified_payments')
        .insert({
          lease_id: leaseId,
          amount: amount,
          amount_paid: 0,
          balance: amount,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          reference_number: referenceNumber,
          description: description,
          status: status,
          type: type,
          days_overdue: daysOverdue,
          late_fine_amount: lateFineAmount,
          original_due_date: originalDueDate || paymentDate
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error creating payment:', error);
        return { success: false, message: error.message };
      }
      
      return { 
        success: true, 
        message: 'Payment created successfully',
        payment: data
      };
    } catch (error: any) {
      console.error('Unexpected error creating payment:', error);
      return { success: false, message: error.message || 'Failed to create payment' };
    } finally {
      setIdle('generating');
    }
  }, [getLeaseDetails, setLoading, setIdle]);
  
  // Generate payment for a special fee
  const generateSpecialPayment = useCallback(async (
    leaseId: string, 
    amount: number, 
    description: string,
    dueDate: string,
    type = 'special'
  ) => {
    return await createPayment({
      leaseId,
      amount,
      paymentDate: dueDate,
      description,
      type,
      status: 'pending'
    });
  }, [createPayment]);

  return {
    getPaymentRecord,
    recordPayment,
    createPayment,
    generateSpecialPayment,
    loadingStates,
    isLoading
  };
};
