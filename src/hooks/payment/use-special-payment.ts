
import { useState, useCallback } from 'react';
import { paymentService } from '@/services/PaymentService';
import { SpecialPaymentOptions } from '@/types/payment-types.unified';

/**
 * Hook for handling special payment operations
 */
export const useSpecialPayment = (agreementId?: string) => {
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Process a payment with additional options for late fees, partial payments, etc.
   */
  const processPayment = useCallback(async (
    amount: number, 
    paymentDate: Date, 
    options?: SpecialPaymentOptions
  ) => {
    if (!agreementId) return false;
    
    setIsProcessing(true);
    try {
      const result = await paymentService.handleSpecialPayment(
        agreementId,
        amount,
        paymentDate,
        options
      );
      
      if (result.error) {
        console.error("Error processing payment:", result.error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Exception in payment processing:", error);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [agreementId]);

  /**
   * Calculate late fee based on a specific date
   */
  const calculateLateFee = useCallback((currentDate: Date) => {
    const daysLate = currentDate.getDate() > 1 ? currentDate.getDate() - 1 : 0;
    const amount = Math.min(daysLate * 120, 3000); // Default daily late fee 120, max 3000
    
    return { amount, daysLate };
  }, []);

  /**
   * Record a partial payment
   */
  const recordPartialPayment = useCallback(async (
    amount: number, 
    paymentDate: Date, 
    options?: SpecialPaymentOptions
  ) => {
    if (!agreementId) return false;
    
    return processPayment(amount, paymentDate, {
      ...options,
      isPartialPayment: true,
    });
  }, [agreementId, processPayment]);

  /**
   * Record a payment on a specific payment (useful for scheduled payments)
   */
  const recordPaymentOnTarget = useCallback(async (
    amount: number, 
    paymentDate: Date, 
    targetPaymentId: string,
    options?: SpecialPaymentOptions
  ) => {
    if (!agreementId) return false;
    
    return processPayment(amount, paymentDate, {
      ...options,
      targetPaymentId
    });
  }, [agreementId, processPayment]);

  return {
    processPayment,
    recordPartialPayment,
    recordPaymentOnTarget,
    calculateLateFee,
    isProcessing
  };
};
