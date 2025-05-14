import { useState, useCallback, useMemo } from 'react';
import { usePayments } from '@/hooks/use-payments'; 
import { usePaymentCalculation } from './use-payment-calculation';
import { useSpecialPayment } from './use-special-payment';
import { useLoadingStates } from './use-loading-states';
import { Payment } from '@/types/payment-types.unified'; // Use the unified type

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
  const { loadingStates, setLoading, setIdle, isAnyLoading } = useLoadingStates({
    updating: false,
    deleting: false,
    adding: false,
    processing: false,
    updateHistoricalStatuses: false
  });

  /**
   * Check if a payment is late
   */
  const isLatePayment = useCallback((payment: any): boolean => {
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
      setLoading('adding');
      return await baseAddPayment(payment as any); // Cast for type compatibility
    } finally {
      setIdle('adding');
    }
  }, [baseAddPayment, setLoading, setIdle]);

  /**
   * Update payment with loading state management
   */
  const updatePayment = useCallback(async (paymentUpdate: { id: string; data: Partial<Payment> }) => {
    try {
      setLoading('updating');
      return await baseUpdatePayment(paymentUpdate as any); // Cast for type compatibility
    } finally {
      setIdle('updating');
    }
  }, [baseUpdatePayment, setLoading, setIdle]);

  /**
   * Delete payment with loading state management
   */
  const deletePayment = useCallback(async (paymentId: string) => {
    try {
      setLoading('deleting');
      return await baseDeletePayment(paymentId);
    } finally {
      setIdle('deleting');
    }
  }, [baseDeletePayment, setLoading, setIdle]);

  /**
   * Update historical payment statuses
   */
  const updateHistoricalStatuses = useCallback(async () => {
    if (!agreementId) return { updatedCount: 0 };
    
    try {
      setLoading('updateHistoricalStatuses');
      
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
      
      return { updatedCount: updatedPayments.length };
    } finally {
      setIdle('updateHistoricalStatuses');
    }
  }, [agreementId, payments, baseUpdatePayment, setLoading, setIdle]);

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
    isAnyLoading,
    
    // Special payment operations
    ...specialPaymentOperations,
    
    // Payment calculations
    ...paymentCalculations
  };
};
