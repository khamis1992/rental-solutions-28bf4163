
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { toast } from 'sonner';
import { castDbId } from '@/utils/database-type-helpers';

export const usePaymentManagement = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Get payment details
  const usePaymentDetails = (paymentId: string) => {
    return useQuery({
      queryKey: ['payment', paymentId],
      queryFn: async () => {
        if (!paymentId) {
          throw new Error('Payment ID is required');
        }

        try {
          const { data, error } = await supabase
            .from('unified_payments')
            .select('*')
            .eq('id', castDbId(paymentId))
            .single();

          if (error) throw error;
          
          if (!data) {
            throw new Error('Payment not found');
          }

          return {
            id: data.id,
            amount: data.amount,
            amount_paid: data.amount_paid,
            balance: data.balance,
            payment_date: data.payment_date,
            payment_method: data.payment_method,
            status: data.status,
            lease_id: data.lease_id,
            type: data.type,
            description: data.description
          };
        } catch (error) {
          console.error(`Error fetching payment ${paymentId}:`, error);
          throw error;
        }
      },
      enabled: !!paymentId
    });
  };

  // Get agreement daily late fee
  const useDailyLateFee = (leaseId: string) => {
    return useQuery({
      queryKey: ['lease-late-fee', leaseId],
      queryFn: async () => {
        if (!leaseId) return 0;

        try {
          const { data, error } = await supabase
            .from('leases')
            .select('daily_late_fee')
            .eq('id', castDbId(leaseId))
            .single();

          if (error) throw error;
          
          return data?.daily_late_fee || 120; // Default to 120 if not set
        } catch (error) {
          console.error('Error fetching daily late fee:', error);
          return 120; // Default value if error
        }
      },
      enabled: !!leaseId
    });
  };

  // Record payment
  const recordPayment = useMutation({
    mutationFn: async ({
      paymentId,
      amount,
      paymentMethod,
      paymentDate
    }: {
      paymentId: string;
      amount: number;
      paymentMethod: string;
      paymentDate: string;
    }) => {
      setIsLoading(true);
      try {
        // Get the payment details first
        const { data: payment, error: fetchError } = await supabase
          .from('unified_payments')
          .select('*')
          .eq('id', castDbId(paymentId))
          .single();

        if (fetchError) throw fetchError;
        if (!payment) throw new Error('Payment not found');

        // Calculate new values
        const amountPaid = payment.amount_paid + amount;
        const balance = payment.amount - amountPaid >= 0 ? payment.amount - amountPaid : 0;
        const status = balance === 0 ? 'completed' : 'partial';

        // Update the payment record
        const { data, error } = await supabase
          .from('unified_payments')
          .update({
            amount_paid: amountPaid,
            balance: balance,
            status: status,
            payment_date: paymentDate,
            payment_method: paymentMethod
          } as any)
          .eq('id', castDbId(paymentId))
          .select();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error recording payment:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    }
  });

  // Create payment with late fees
  const createPayment = useMutation({
    mutationFn: async ({
      leaseId,
      amount,
      paymentDate,
      dueDate,
      paymentMethod,
      referenceNumber,
      description,
      lateFeeAmount = 0
    }: {
      leaseId: string;
      amount: number;
      paymentDate: string;
      dueDate: string;
      paymentMethod: string;
      referenceNumber?: string;
      description?: string;
      lateFeeAmount?: number;
    }) => {
      setIsLoading(true);
      try {
        // Calculate days overdue
        const due = new Date(dueDate);
        const paid = new Date(paymentDate);
        const daysOverdue = Math.max(0, Math.floor((paid.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));

        // Create the payment record
        const { data, error } = await supabase
          .from('unified_payments')
          .insert({
            lease_id: leaseId,
            amount: amount,
            amount_paid: amount, // Fully paid
            balance: 0,
            payment_date: paymentDate,
            payment_method: paymentMethod,
            reference_number: referenceNumber,
            description: description || 'Payment',
            status: 'completed',
            type: 'Income',
            days_overdue: daysOverdue,
            late_fine_amount: lateFeeAmount,
            original_due_date: dueDate
          } as any)
          .select();

        if (error) throw error;

        // If there's a late fee, create a late fee record
        if (lateFeeAmount > 0) {
          const { error: lateFeeError } = await supabase
            .from('unified_payments')
            .insert({
              lease_id: leaseId,
              amount: lateFeeAmount,
              amount_paid: 0,
              balance: lateFeeAmount,
              payment_date: null,
              payment_method: null,
              description: 'Late Payment Fee',
              status: 'pending',
              type: 'LATE_PAYMENT_FEE',
              days_overdue: daysOverdue,
              original_due_date: dueDate
            } as any);

          if (lateFeeError) {
            console.error('Error creating late fee record:', lateFeeError);
            // Continue anyway as the main payment was recorded
          }
        }

        return data;
      } catch (error) {
        console.error('Error creating payment:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    }
  });

  return {
    isLoading,
    usePaymentDetails,
    useDailyLateFee,
    recordPayment: recordPayment.mutateAsync,
    createPayment: createPayment.mutateAsync
  };
};
