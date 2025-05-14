
import { useState, useCallback } from 'react';
import { usePayments } from '@/hooks/use-payments';
import { useLoadingStates } from './use-loading-states';
import { Payment } from '@/types/payment-types.unified';
import { toast } from 'sonner';
import { isAfter, differenceInDays, parseISO } from 'date-fns';

// Define payment status types for filtering
type PaymentStatusFilter = 'completed_ontime' | 'completed_late' | 'pending' | 'overdue' | null;

export const usePaymentManagement = (agreementId?: string) => {
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>(null);
  const { loadingStates, setLoading, setIdle } = useLoadingStates({
    updateHistoricalStatuses: false
  });

  const { 
    payments, 
    isLoading, 
    error, 
    addPayment, 
    updatePayment, 
    deletePayment,
    fetchPayments 
  } = usePayments(agreementId);

  const isLatePayment = useCallback((payment: Payment): boolean => {
    // If there's no payment_date or due_date, we can't determine if it's late
    if (!payment.payment_date || !payment.due_date) return false;

    try {
      const paymentDate = parseISO(payment.payment_date);
      const dueDate = parseISO(payment.due_date);
      return isAfter(paymentDate, dueDate);
    } catch (e) {
      console.error('Error parsing dates:', e);
      return false;
    }
  }, []);

  const getFilterLabel = useCallback((): string => {
    switch(statusFilter) {
      case 'completed_ontime':
        return 'Paid On Time';
      case 'completed_late':
        return 'Paid Late';
      case 'pending':
        return 'Pending';
      case 'overdue':
        return 'Overdue';
      default:
        return 'All Payments';
    }
  }, [statusFilter]);

  const updateHistoricalStatuses = useCallback(async (): Promise<{ updatedCount: number }> => {
    if (!agreementId || !Array.isArray(payments)) {
      return { updatedCount: 0 };
    }
    
    setLoading('updateHistoricalStatuses');
    
    try {
      let updatedCount = 0;
      const paymentsToUpdate = payments.filter(payment => 
        // Only consider payments with a payment_date (already paid) but status isn't 'completed'
        payment.payment_date && payment.status !== 'completed'
      );
      
      for (const payment of paymentsToUpdate) {
        await updatePayment({
          id: payment.id,
          data: { ...payment, status: 'completed' as string }
        });
        updatedCount++;
      }
      
      if (updatedCount > 0) {
        toast.success(`Updated ${updatedCount} historical payment records`);
        fetchPayments();
      }
      
      return { updatedCount };
    } catch (error) {
      console.error('Error updating historical payment statuses:', error);
      toast.error('Failed to update historical payment records');
      return { updatedCount: 0 };
    } finally {
      setIdle('updateHistoricalStatuses');
    }
  }, [agreementId, payments, updatePayment, fetchPayments, setLoading, setIdle]);

  return {
    payments,
    isLoading,
    error,
    addPayment,
    updatePayment,
    deletePayment,
    fetchPayments,
    statusFilter,
    setStatusFilter,
    getFilterLabel,
    isLatePayment,
    updateHistoricalStatuses,
    loadingStates
  };
};
