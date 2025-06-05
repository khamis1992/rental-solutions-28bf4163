
import { useMemo } from 'react';
import { Payment } from '@/types/payment.types';

interface PaymentMetrics {
  totalAmount: number;
  amountPaid: number;
  balance: number;
  lateFees: number;
  paidOnTime: number;
  paidLate: number;
  unpaid: number;
}

export const usePaymentCalculation = (
  payments: Payment[] = [],
  contractAmount: number | null = null,
  startDate: Date | string | null = null,
  endDate: Date | string | null = null
): PaymentMetrics => {
  return useMemo(() => {
    // Default values
    const metrics: PaymentMetrics = {
      totalAmount: contractAmount || 0,
      amountPaid: 0,
      balance: 0,
      lateFees: 0,
      paidOnTime: 0,
      paidLate: 0,
      unpaid: 0
    };

    if (!payments || payments.length === 0) {
      return metrics;
    }

    // Calculate total amount paid
    metrics.amountPaid = payments
      .filter(payment => payment.status === 'paid' || payment.status === 'completed')
      .reduce((sum, payment) => sum + (payment.amount_paid || payment.amount || 0), 0);

    // Calculate total late fees
    metrics.lateFees = payments
      .reduce((sum, payment) => sum + (payment.late_fine_amount || 0), 0);

    // Count payments by status
    payments.forEach(payment => {
      if (payment.type === 'LATE_PAYMENT_FEE') return;
      
      if (payment.status === 'paid' || payment.status === 'completed') {
        if (payment.days_overdue && payment.days_overdue > 0) {
          metrics.paidLate++;
        } else {
          metrics.paidOnTime++;
        }
      } else if (payment.status === 'pending' || payment.status === 'overdue') {
        metrics.unpaid++;
      }
    });

    // Calculate balance
    metrics.balance = metrics.totalAmount - metrics.amountPaid;
    if (metrics.balance < 0) metrics.balance = 0;

    return metrics;
  }, [payments, contractAmount, startDate, endDate]);
};
