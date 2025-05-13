
import { useState, useCallback, useMemo } from 'react';
import { usePayments } from '@/hooks/use-payments'; 
import { usePaymentCalculation } from './use-payment-calculation';
import { useSpecialPayment } from './use-special-payment';
import { useLoadingStates } from './use-loading-states';
import { Payment } from '@/types/payment-types.unified';
import { PaymentStatus } from '@/lib/database/database-types';

export type PaymentFilter = null | 'pending' | 'completed' | 'overdue' | 'completed_ontime' | 'completed_late';

/**
 * Hook for managing payments with comprehensive functionality
 */
export const usePaymentManagement = (agreementId?: string) => {
  // Use the base payment hooks
  const { 
    payments, 
    isLoading, 
    error, 
    addPayment: baseAddPayment, 
    updatePayment: baseUpdatePayment,
    deletePayment: baseDeletePayment,
    fetchPayments
  } = usePayments(agreementId);

  // Payment calculation hook
  const paymentCalculations = usePaymentCalculation(payments);

  // Special payment operations
  const specialPaymentOperations = useSpecialPayment(agreementId);

  // Payment filtering state
  const [statusFilter, setStatusFilter] = useState<PaymentFilter>(null);

  // Loading states
  const { loadingStates, setLoading, isAnyLoading } = useLoadingStates({
    updating: false,
    deleting: false,
    adding: false,
    processing: false,
    updateHistoricalStatuses: false
  });

  /**
   * Check if a payment is late
   */
  const isLatePayment = useCallback((payment: Payment): boolean => {
    if (!payment.payment_date || !payment.due_date) return false;
    
    const paymentDate = new Date(payment.payment_date);
    const dueDate = new Date(payment.due_date);
    
    return paymentDate > dueDate;
  }, []);

  /**
   * Get human-readable filter label
   */
  const getFilterLabel = useCallback((): string => {
    switch (statusFilter) {
      case 'completed_ontime': return 'Paid On Time';
      case 'completed_late': return 'Paid Late';
      case 'pending': return 'Pending';
      case 'overdue': return 'Overdue';
      case 'completed': return 'Completed';
      default: return 'All Payments';
    }
  }, [statusFilter]);

  /**
   * Add payment with loading state management
   */
  const addPayment = useCallback(async (payment: Partial<Payment>) => {
    try {
      setLoading('adding', true);
      return await baseAddPayment(payment);
    } finally {
      setLoading('adding', false);
    }
  }, [baseAddPayment, setLoading]);

  /**
   * Update payment with loading state management
   */
  const updatePayment = useCallback(async (paymentUpdate: { id: string; data: Partial<Payment> }) => {
    try {
      setLoading('updating', true);
      return await baseUpdatePayment(paymentUpdate);
    } finally {
      setLoading('updating', false);
    }
  }, [baseUpdatePayment, setLoading]);

  /**
   * Delete payment with loading state management
   */
  const deletePayment = useCallback(async (paymentId: string) => {
    try {
      setLoading('deleting', true);
      return await baseDeletePayment(paymentId);
    } finally {
      setLoading('deleting', false);
    }
  }, [baseDeletePayment, setLoading]);

  /**
   * Update historical payment statuses
   */
  const updateHistoricalStatuses = useCallback(async () => {
    if (!agreementId) return;
    
    try {
      setLoading('updateHistoricalStatuses', true);
      
      // Find payments that need status updates
      const updatedPayments = payments.filter(payment => {
        // Only process completed payments with payment dates
        if (payment.status !== 'completed' || !payment.payment_date) return false;
        
        const paymentDate = new Date(payment.payment_date);
        const dueDate = payment.due_date ? new Date(payment.due_date) : null;
        
        // If payment has due date and was paid after due date, mark as late payment
        if (dueDate && paymentDate > dueDate) {
          return true;
        }
        
        return false;
      });
      
      // Update each payment
      for (const payment of updatedPayments) {
        await baseUpdatePayment({
          id: payment.id,
          data: {
            status: 'completed' as PaymentStatus,
            days_overdue: payment.days_overdue || 0
          }
        });
      }
      
      return updatedPayments.length;
    } finally {
      setLoading('updateHistoricalStatuses', false);
    }
  }, [agreementId, payments, baseUpdatePayment, setLoading]);

  // Filtered payments based on status filter
  const filteredPayments = useMemo(() => {
    if (!statusFilter) return payments;
    
    return payments.filter(payment => {
      if (statusFilter === 'completed_ontime') {
        return payment.status === 'completed' && !isLatePayment(payment);
      } else if (statusFilter === 'completed_late') {
        return payment.status === 'completed' && isLatePayment(payment);
      } else {
        return payment.status === statusFilter;
      }
    });
  }, [payments, statusFilter, isLatePayment]);

  return {
    // Base payment data
    payments: filteredPayments,
    allPayments: payments,
    isLoading,
    error,
    
    // Payment filtering
    statusFilter,
    setStatusFilter,
    getFilterLabel,
    isLatePayment,
    
    // Payment operations
    addPayment,
    updatePayment,
    deletePayment,
    fetchPayments,
    updateHistoricalStatuses,
    
    // Loading states
    loadingStates,
    setLoading,
    isAnyLoading,
    
    // Special payment operations
    ...specialPaymentOperations,
    
    // Payment calculations
    ...paymentCalculations
  };
};
