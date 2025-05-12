
import { useMemo } from 'react';
import { Payment } from '@/types/payment.types';

/**
 * Hook for calculating payment statistics
 */
export function usePaymentCalculation(payments: Payment[] = [], rentAmount: number | null = null, contractAmount: number | null = null) {
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
    
    // Calculate percentage paid
    const percentagePaid = effectiveTotal > 0 ? (amountPaid / effectiveTotal) * 100 : 0;
    
    // Count overdue payments
    const overduePayments = payments.filter(
      payment => payment.status === 'pending' && 
      payment.due_date && 
      new Date(payment.due_date) < new Date()
    ).length;

    // Find next payment date
    const upcomingPayments = payments
      .filter(payment => 
        payment.status === 'pending' && 
        payment.due_date && 
        new Date(payment.due_date) >= new Date()
      )
      .sort((a, b) => {
        if (!a.due_date || !b.due_date) return 0;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
      
    const nextPaymentDue = upcomingPayments.length > 0 ? upcomingPayments[0].due_date : null;
    
    return {
      totalAmount,
      amountPaid,
      balance,
      percentagePaid,
      overduePayments,
      nextPaymentDue,
      remainingPayments: upcomingPayments.length
    };
  }, [payments, rentAmount, contractAmount]);
}
