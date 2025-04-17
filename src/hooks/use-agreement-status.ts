
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { exists } from '@/utils/database-type-helpers';

// Helper function to safely get property values when they might be null/undefined
const safeGet = <T, K extends keyof T>(obj: T | null | undefined, key: K, defaultValue: T[K]): T[K] => {
  if (obj === null || obj === undefined) return defaultValue;
  return obj[key] !== undefined ? obj[key] : defaultValue;
};

// Helper function to check if a response has data 
const hasData = (response: any): boolean => {
  return response && !response.error && response.data;
};

export const useAgreementStatus = (agreementId: string) => {
  const queryClient = useQueryClient();

  const { data: agreement, isLoading, error } = useQuery({
    queryKey: ['agreement', agreementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leases')
        .select(`
          id, 
          agreement_number,
          status,
          start_date,
          end_date,
          rent_amount,
          rent_due_day,
          total_amount
        `)
        .eq('id', agreementId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!agreementId,
  });

  const { data: payments, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['agreement-payments', agreementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', agreementId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!agreementId,
  });

  const checkIsPaymentCreated = async (month: number, year: number) => {
    if (!payments) return false;
    
    return payments.some((payment: any) => {
      if (!payment.due_date) return false;
      
      const paymentDate = new Date(payment.due_date);
      return paymentDate.getMonth() === month && paymentDate.getFullYear() === year;
    });
  };

  const generateNextPayment = async () => {
    if (!agreement) {
      console.error('Agreement data not available');
      return { success: false, message: 'Agreement data not available' };
    }
    
    // Default to 1 if rent_due_day is not available
    const rentDueDay = agreement.rent_due_day || 1;
    
    // Use a safer default value if rent_amount is not available
    const rentAmount = safeGet(agreement, 'rent_amount', 0);
    
    if (rentAmount <= 0) {
      return { 
        success: false, 
        message: 'Invalid rent amount: ' + rentAmount 
      };
    }
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Check if we already have a payment for this month
    const paymentExists = await checkIsPaymentCreated(currentMonth, currentYear);
    if (paymentExists) {
      return { 
        success: false, 
        message: 'Payment for current month already exists' 
      };
    }
    
    // Set the due date to the rent_due_day of current month
    const dueDate = new Date(currentYear, currentMonth, rentDueDay);
    
    // Format the due date as ISO string
    const dueDateString = dueDate.toISOString();
    
    try {
      // Insert the new payment
      const { data, error } = await supabase
        .from('unified_payments')
        .insert({
          lease_id: agreementId,
          amount: rentAmount,
          amount_paid: 0,
          balance: rentAmount,
          description: `Rent payment for ${dueDate.toLocaleString('default', { month: 'long' })} ${currentYear}`,
          type: 'Income',
          status: 'pending',
          due_date: dueDateString,
          is_recurring: true
        });
      
      if (error) {
        throw error;
      }
      
      // Invalidate the cache to refetch payments
      queryClient.invalidateQueries({ queryKey: ['agreement-payments', agreementId] });
      
      return { 
        success: true, 
        message: 'Payment schedule generated successfully' 
      };
      
    } catch (error: any) {
      console.error('Error generating payment:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to generate payment' 
      };
    }
  };

  return {
    agreement,
    payments,
    isLoading: isLoading || isLoadingPayments,
    error,
    generateNextPayment,
  };
};
