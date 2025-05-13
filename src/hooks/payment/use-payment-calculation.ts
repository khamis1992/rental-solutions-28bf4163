
import { useMemo } from 'react';
import { Payment } from '@/types/payment.types';

/**
 * Hook for payment calculations and analytics
 */
export function usePaymentCalculation(payments: Payment[], contractAmount?: number | null) {
  const calculations = useMemo(() => {
    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      return {
        totalAmount: 0,
        amountPaid: 0,
        balance: 0,
        lateFees: 0,
        paidCount: 0,
        pendingCount: 0,
        overdueCount: 0,
      };
    }
    
    // Calculate payment statistics
    const totalAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    // Calculate amount paid from COMPLETED payments only
    const amountPaid = payments
      .filter(payment => payment.status === 'completed')
      .reduce((sum, payment) => sum + (payment.amount_paid || payment.amount || 0), 0);
    
    // Calculate balance based on contract amount if available
    // If contractAmount is provided, use it for balance calculation, otherwise use totalAmount
    const effectiveTotal = contractAmount !== undefined && contractAmount !== null 
      ? contractAmount 
      : totalAmount;
    
    // Balance is the contract amount minus the amount that has been paid with completed payments
    const balance = effectiveTotal - amountPaid;
    
    // Calculate late fees
    const lateFees = payments.reduce((sum, payment) => sum + (payment.late_fine_amount || 0), 0);
    
    // Count payments by status
    const paidCount = payments.filter(p => p.status === 'completed').length;
    const pendingCount = payments.filter(p => p.status === 'pending').length;
    const overdueCount = payments.filter(p => p.status === 'overdue').length;
    
    return {
      totalAmount,
      amountPaid,
      balance,
      lateFees,
      paidCount,
      pendingCount,
      overdueCount,
    };
  }, [payments, contractAmount]);
  
  return calculations;
}
