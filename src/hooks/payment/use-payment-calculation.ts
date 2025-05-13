
import { useMemo } from 'react';
import { Payment } from '@/types/payment-types.unified';

/**
 * Hook for calculating payment-related metrics and statistics
 */
export const usePaymentCalculation = (payments: Payment[], contractAmount: number | null = null) => {
  // Calculate payment metrics
  const {
    totalAmount,
    amountPaid,
    balance,
    lateFees
  } = useMemo(() => {
    let total = 0;
    let paid = 0;
    let lateFeeTotal = 0;
    
    // Sum up all payment amounts and paid amounts
    payments.forEach(payment => {
      // Only count rent/income type payments for totals
      if (payment.type === 'rent' || payment.type === 'Income') {
        total += payment.amount || 0;
        paid += payment.amount_paid || 0;
      }
      
      // Sum up late fees separately
      if (payment.late_fine_amount) {
        lateFeeTotal += payment.late_fine_amount;
      }
    });
    
    // If contract amount is provided, use that as the total
    const finalTotal = contractAmount || total;
    
    return {
      totalAmount: finalTotal,
      amountPaid: paid,
      balance: Math.max(0, finalTotal - paid),
      lateFees: lateFeeTotal
    };
  }, [payments, contractAmount]);

  // Calculate payment status counts
  const {
    paidOnTime,
    paidLate,
    unpaid,
    totalPayments
  } = useMemo(() => {
    let onTime = 0;
    let late = 0;
    let pending = 0;
    
    payments.forEach(payment => {
      if (payment.status === 'completed') {
        // Consider payment late if it has days_overdue or late_fine_amount
        if (payment.days_overdue || payment.late_fine_amount) {
          late++;
        } else {
          onTime++;
        }
      } else if (payment.status === 'pending' || payment.status === 'overdue') {
        pending++;
      }
    });
    
    return {
      paidOnTime: onTime,
      paidLate: late,
      unpaid: pending,
      totalPayments: payments.length
    };
  }, [payments]);

  return {
    totalAmount,
    amountPaid,
    balance,
    lateFees,
    paidOnTime,
    paidLate,
    unpaid,
    totalPayments
  };
};
