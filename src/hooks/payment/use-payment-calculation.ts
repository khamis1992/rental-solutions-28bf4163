import { useMemo } from 'react';
import { Payment, PaymentStatus } from '@/types/payment.types';
import { differenceInCalendarMonths, addMonths, startOfMonth, endOfMonth, isAfter, isBefore, min, max } from 'date-fns';

/**
 * Hook for calculating payment-related metrics and statistics
 */
export const usePaymentCalculation = (
  payments: Payment[],
  rentAmount: number | null,
  startDate: string | Date | null,
  endDate: string | Date | null
) => {
  // Calculate duration in months (inclusive)
  const duration = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    return differenceInCalendarMonths(end, start) + 1;
  }, [startDate, endDate]);

  // Calculate total amount
  const totalAmount = useMemo(() => {
    if (!rentAmount || !duration) return 0;
    return rentAmount * duration;
  }, [rentAmount, duration]);

  // Calculate amount paid (only payments with status 'paid', 'completed', or 'partially_paid')
  const amountPaid = useMemo(() => {
    return payments
      .filter(p => ['paid', 'completed', 'partially_paid'].includes(String(p.status)))
      .reduce((sum, p) => sum + (p.amount_paid || p.amount || 0), 0);
  }, [payments]);

  // Calculate balance (sum of pending and overdue payments)
  const balance = useMemo(() => {
    return payments
      .filter(p => ['pending', 'overdue'].includes(String(p.status)))
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [payments]);

  // Calculate late fees: sum of late_fine_amount from all payments (matches Payment History table)
  const lateFees = useMemo(() => {
    return payments.reduce((sum, p) => sum + (p.late_fine_amount || 0), 0);
  }, [payments]);

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
      if (['paid', 'completed', 'partially_paid'].includes(String(payment.status))) {
        // Paid late if days_overdue > 0 or late_fine_amount > 0
        if ((payment.days_overdue && payment.days_overdue > 0) || (payment.late_fine_amount && payment.late_fine_amount > 0)) {
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
      totalPayments: payments.length,
      duration
    };
  }, [payments, duration]);

  return {
    totalAmount,
    amountPaid,
    balance,
    lateFees,
    paidOnTime,
    paidLate,
    unpaid,
    totalPayments,
    duration
  };
};
