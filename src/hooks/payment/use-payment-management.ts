
import { useState, useMemo, useCallback } from 'react';
import { usePaymentService } from '../services/usePaymentService';
import { usePaymentSchedule } from './use-payment-schedule';
import { useLoadingStates } from './use-loading-states';
import { Payment, SpecialPaymentOptions } from '@/types/payment.types';

/**
 * A comprehensive hook for managing payments
 * Centralizes payment operations, filtering, calculations, and analytics
 */
export function usePaymentManagement(agreementId?: string) {
  // Get payment data and operations from service
  const {
    payments,
    isLoading: isDataLoading,
    error,
    recordPayment,
    updatePayment,
    deletePayment,
    handleSpecialPayment,
    checkAndCreateMissingPayments,
    fixAgreementPayments,
    updateHistoricalPaymentStatuses,
    isPending: serviceIsPending
  } = usePaymentService(agreementId);

  // Get payment schedule operations from schedule hook
  const {
    generatePayment,
    runMaintenanceJob,
    fixPaymentAnomalies,
    isPending: scheduleIsPending
  } = usePaymentSchedule();

  // Payment filtering state
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  // Consolidated loading states
  const { loadingStates, setLoading, wrapWithLoading, isAnyLoading } = useLoadingStates({
    ...serviceIsPending,
    generatePayment: scheduleIsPending.generatePayment,
    runMaintenance: scheduleIsPending.runMaintenanceJob,
    fixAnomalies: scheduleIsPending.fixPaymentAnomalies
  });

  // Calculate payment statistics and metrics
  const paymentMetrics = useMemo(() => {
    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      return {
        totalAmount: 0,
        amountPaid: 0,
        balance: 0,
        lateFees: 0,
        paidOnTime: 0,
        paidLate: 0,
        unpaid: 0,
        totalPayments: 0
      };
    }

    // Total amount from all payments
    const totalAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    // Amount paid from COMPLETED payments only
    const amountPaid = payments
      .filter(payment => payment.status === 'completed')
      .reduce((sum, payment) => sum + (payment.amount_paid || payment.amount || 0), 0);
    
    // Calculate balance (total minus paid)
    const balance = totalAmount - amountPaid;
    
    // Calculate late fees
    const lateFees = payments.reduce((sum, payment) => sum + (payment.late_fine_amount || 0), 0);

    // Payment status counts
    const paidOnTime = payments.filter(p => 
      p.status === 'completed' && !isLatePayment(p)
    ).length;
    
    const paidLate = payments.filter(p => 
      p.status === 'completed' && isLatePayment(p)
    ).length;
    
    const unpaid = payments.filter(p => 
      p.status === 'pending' || p.status === 'overdue'
    ).length;

    return {
      totalAmount,
      amountPaid,
      balance,
      lateFees,
      paidOnTime,
      paidLate,
      unpaid,
      totalPayments: payments.length
    };
  }, [payments]);

  // Helper function to determine if a payment was late
  const isLatePayment = useCallback((payment: Payment): boolean => {
    // First check if days_overdue is available and greater than 0
    if (payment.days_overdue && payment.days_overdue > 0) {
      return true;
    }
    
    // If days_overdue is not available, check if there's late_fine_amount
    if (payment.late_fine_amount && payment.late_fine_amount > 0) {
      return true;
    }
    
    // If payment_date and due_date are available, compare them
    if (payment.payment_date && payment.due_date) {
      const paymentDate = new Date(payment.payment_date);
      const dueDate = new Date(payment.due_date);
      return paymentDate > dueDate;
    }
    
    // If payment_date and original_due_date are available, compare them
    if (payment.payment_date && payment.original_due_date) {
      const paymentDate = new Date(payment.payment_date);
      const originalDueDate = new Date(payment.original_due_date);
      return paymentDate > originalDueDate;
    }
    
    // Default to false if we can't determine
    return false;
  }, []);

  // Filter payments based on selected status
  const filteredPayments = useMemo(() => {
    if (!payments || !Array.isArray(payments)) return [];
    
    return statusFilter
      ? payments.filter(payment => {
          if (statusFilter === 'completed_ontime') {
            return payment.status === 'completed' && !isLatePayment(payment);
          } else if (statusFilter === 'completed_late') {
            return payment.status === 'completed' && isLatePayment(payment);
          } else {
            return payment.status === statusFilter;
          }
        })
      : payments;
  }, [payments, statusFilter, isLatePayment]);

  // Function to get filter label for UI display
  const getFilterLabel = useCallback(() => {
    switch (statusFilter) {
      case 'completed':
        return 'Completed';
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

  // Process payment submission with loading state management
  const handlePaymentSubmit = async (
    amount: number, 
    paymentDate: Date, 
    notes?: string,
    paymentMethod?: string,
    referenceNumber?: string,
    includeLatePaymentFee?: boolean,
    isPartialPayment?: boolean,
    paymentType?: string
  ) => {
    if (!agreementId) return false;

    setLoading('handleSpecialPayment', true);
    try {
      // Create options object for additional parameters
      const options: SpecialPaymentOptions = {
        notes,
        paymentMethod,
        referenceNumber,
        includeLatePaymentFee,
        isPartialPayment,
        paymentType
      };

      // Pass required parameters and options object
      return await handleSpecialPayment({
        agreementId,
        amount,
        paymentDate,
        options
      });
    } finally {
      setLoading('handleSpecialPayment', false);
    }
  };

  // Update all historical payments to 'completed' status
  const updateHistoricalStatuses = wrapWithLoading('updateHistoricalStatuses', 
    async () => {
      if (!agreementId) return { updatedCount: 0 };
      
      // Use September 1, 2024 as the cutoff date
      const cutoffDate = new Date(2024, 8, 1); // Month is 0-indexed, so 8 is September
      
      return updateHistoricalPaymentStatuses({
        agreementId, 
        cutoffDate
      });
    }
  );

  // Generate payment for the current agreement
  const generatePaymentSchedule = wrapWithLoading('generatePaymentSchedule',
    async () => {
      if (!agreementId) return false;
      return generatePayment(agreementId);
    }
  );

  // Run maintenance job for all agreements
  const runPaymentMaintenance = wrapWithLoading('runPaymentMaintenance',
    async () => {
      return runMaintenanceJob();
    }
  );

  return {
    // Payment data
    payments: filteredPayments,
    allPayments: payments,
    isLoading: isDataLoading,
    error,
    
    // Payment metrics
    metrics: paymentMetrics,
    
    // Payment operations
    recordPayment,
    updatePayment,
    deletePayment,
    handlePaymentSubmit,
    checkAndCreateMissingPayments,
    fixAgreementPayments,
    updateHistoricalStatuses,
    generatePaymentSchedule,
    runPaymentMaintenance,
    fixPaymentAnomalies,
    
    // Filtering
    statusFilter,
    setStatusFilter,
    getFilterLabel,
    isLatePayment,
    
    // Loading states
    loadingStates,
    isAnyLoading
  };
}
