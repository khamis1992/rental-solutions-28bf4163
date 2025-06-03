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

  // Calculate amount paid
  const amountPaid = useMemo(() => {
    return payments
      .filter(p => (p.type === 'rent' || p.type === 'Income') && p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount_paid || 0), 0);
  }, [payments]);

  // Calculate balance
  const balance = Math.max(0, totalAmount - amountPaid);

  // Calculate late fees
  const lateFees = useMemo(() => {
    if (!startDate || !endDate || !rentAmount) return 0;
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    let totalLateFees = 0;
    let current = startOfMonth(start);
    const today = new Date();
    while (!isAfter(current, end)) {
      // Find payment for this month
      const monthPaid = payments.some(p => {
        if ((p.type === 'rent' || p.type === 'Income') && p.status === 'completed' && p.payment_date) {
          const paidDate = new Date(p.payment_date);
          return paidDate.getFullYear() === current.getFullYear() && paidDate.getMonth() === current.getMonth();
        }
        return false;
      });
      if (!monthPaid) {
        // Calculate days late: from 1st of month to today or end of month, whichever is earlier
        const dueDate = startOfMonth(current);
        const lastDate = min([endOfMonth(current), today, end]);
        let daysLate = 0;
        if (isBefore(dueDate, today)) {
          daysLate = Math.floor((min([lastDate, today]).getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          daysLate = Math.max(daysLate, 0);
        }
        let fee = daysLate * 120;
        if (fee > 3000) fee = 3000;
        totalLateFees += fee;
      }
      current = addMonths(current, 1);
    }
    return totalLateFees;
  }, [payments, startDate, endDate, rentAmount]);

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
      } else if (payment.status === 'pending' || payment.status === 'overdue' || payment.status === 'partially_paid') {
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
