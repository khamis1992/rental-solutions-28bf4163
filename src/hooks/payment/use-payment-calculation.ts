
import { useMemo } from 'react';
import { Payment } from '@/types/payment.types';

/**
 * Hook for calculating payment statistics
 */
export function usePaymentCalculation(payments: Payment[], rentAmount: number | null = null, contractAmount: number | null = null) {
  return useMemo(() => {
    // Total amount from all payments
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Amount paid from completed payments only
    const amountPaid = payments
      .filter(payment => payment.status === 'completed')
      .reduce((sum, payment) => sum + (payment.amount_paid || payment.amount || 0), 0);
    
    // Use contract amount if available, otherwise use totalAmount
    const effectiveTotal = contractAmount || totalAmount;
    
    // Balance is the contract amount minus the amount that has been paid
    const balance = effectiveTotal - amountPaid;
    
    // Calculate late fees
    const lateFees = payments.reduce((sum, payment) => sum + (payment.late_fine_amount || 0), 0);

    // Helper function to determine if a payment was late
    const isLatePayment = (payment: Payment): boolean => {
      if (payment.days_overdue && payment.days_overdue > 0) {
        return true;
      }
      
      if (payment.late_fine_amount && payment.late_fine_amount > 0) {
        return true;
      }
      
      return false;
    };
    
    // Calculate payment status counts
    const paidOnTime = payments.filter(p => 
      p.status === 'completed' && !isLatePayment(p)
    ).length;
    
    const paidLate = payments.filter(p => 
      p.status === 'completed' && isLatePayment(p)
    ).length;
    
    const pendingCount = payments.filter(p => 
      p.status === 'pending' || p.status === 'partially_paid'
    ).length;

    const overdueCount = payments.filter(p => 
      p.status === 'overdue' || (p.status === 'pending' && p.days_overdue && p.days_overdue > 0)
    ).length;

    return {
      totalAmount,
      amountPaid,
      balance,
      lateFees,
      paidOnTime,
      paidLate,
      pendingCount,
      overdueCount,
      paymentStatistics: {
        total: payments.length,
        completed: paidOnTime + paidLate,
        pending: pendingCount,
        overdue: overdueCount
      }
    };
  }, [payments, rentAmount, contractAmount]);
}
