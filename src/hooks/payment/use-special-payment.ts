
// @ts-nocheck
/* eslint-disable */
import { useCallback } from 'react';
import { usePaymentGeneration } from '@/hooks/use-payment-generation';
import { SpecialPaymentOptions } from '@/types/payment.types';

export function useSpecialPayment(agreementId?: string) {
  const { createPayment } = usePaymentGeneration();

  const calculateLateFee = useCallback((paymentDate: Date) => {
    if (!paymentDate) return { amount: 0, daysLate: 0 };
    
    const today = new Date();
    const dueDay = 1; // First of the month
    const dueDate = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), dueDay);
    
    if (paymentDate <= dueDate) {
      return { amount: 0, daysLate: 0 };
    }
    
    const daysLate = Math.floor((paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const dailyLateFee = 120; // Default daily late fee
    const amount = Math.min(daysLate * dailyLateFee, 3000); // Cap at 3000
    
    return { amount, daysLate };
  }, []);

  const processPayment = useCallback(async (
    amount: number,
    paymentDate: Date,
    options?: SpecialPaymentOptions
  ) => {
    if (!agreementId) return false;

    const {
      notes = 'Monthly rent payment',
      paymentMethod = 'cash',
      referenceNumber = '',
      includeLatePaymentFee = false,
      isPartialPayment = false,
      paymentType = 'rent'
    } = options || {};

    try {
      const { amount: lateFeeAmount, daysLate } = calculateLateFee(paymentDate);
      
      const result = await createPayment({
        leaseId: agreementId,
        amount,
        paymentDate: paymentDate.toISOString(),
        paymentMethod,
        referenceNumber,
        description: notes,
        status: isPartialPayment ? 'partially_paid' : 'completed',
        type: paymentType,
        daysOverdue: daysLate,
        originalDueDate: new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1).toISOString()
      });

      if (result.success && includeLatePaymentFee && lateFeeAmount > 0) {
        await createPayment({
          leaseId: agreementId,
          amount: lateFeeAmount,
          paymentDate: paymentDate.toISOString(),
          paymentMethod,
          referenceNumber,
          description: `Late payment fee (${daysLate} days late)`,
          status: 'completed',
          type: 'LATE_PAYMENT_FEE',
          daysOverdue: daysLate,
          originalDueDate: new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1).toISOString()
        });
      }

      return result.success;
    } catch (error) {
      console.error('Error processing payment:', error);
      return false;
    }
  }, [agreementId, calculateLateFee, createPayment]);

  return {
    processPayment,
    calculateLateFee
  };
}
