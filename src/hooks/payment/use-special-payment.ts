
import { useCallback } from 'react';
import { usePaymentService } from '../services/usePaymentService';
import { Payment, SpecialPaymentOptions } from '@/types/payment.types';
import { toast } from 'sonner';

/**
 * Hook for handling special payment operations
 */
export function useSpecialPayment(agreementId?: string) {
  const { handleSpecialPayment } = usePaymentService(agreementId);

  /**
   * Process a payment with special options like late fees
   */
  const processPayment = useCallback(async (
    amount: number,
    paymentDate: Date,
    options: SpecialPaymentOptions = {}
  ): Promise<boolean> => {
    if (!agreementId) {
      toast.error("Agreement ID is required");
      return false;
    }

    try {
      const result = await handleSpecialPayment({
        agreementId,
        amount,
        paymentDate,
        options
      });

      return result !== null && result !== undefined;
    } catch (error) {
      console.error("Error processing special payment:", error);
      toast.error(`Failed to process payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }, [agreementId, handleSpecialPayment]);

  /**
   * Calculate late fee for a given payment date
   */
  const calculateLateFee = useCallback((
    paymentDate: Date,
    dailyLateFee: number = 120
  ): { amount: number; daysLate: number } => {
    // Late fee only applies if payment date is after the 1st of the month
    if (paymentDate.getDate() <= 1) {
      return { amount: 0, daysLate: 0 };
    }

    // Calculate days late
    const daysLate = paymentDate.getDate() - 1;
    
    // Calculate late fee (capped at 3000)
    const amount = Math.min(daysLate * dailyLateFee, 3000);
    
    return { amount, daysLate };
  }, []);

  /**
   * Check if a payment is considered late
   */
  const isLatePayment = useCallback((payment: Payment): boolean => {
    // Check if days_overdue is set and positive
    if (payment.days_overdue && payment.days_overdue > 0) {
      return true;
    }
    
    // Check if late_fine_amount is set and positive
    if (payment.late_fine_amount && payment.late_fine_amount > 0) {
      return true;
    }
    
    // Compare payment date with due date
    if (payment.payment_date && payment.due_date) {
      return new Date(payment.payment_date) > new Date(payment.due_date);
    }
    
    // Compare payment date with original due date
    if (payment.payment_date && payment.original_due_date) {
      return new Date(payment.payment_date) > new Date(payment.original_due_date);
    }
    
    return false;
  }, []);

  return {
    processPayment,
    calculateLateFee,
    isLatePayment
  };
}
