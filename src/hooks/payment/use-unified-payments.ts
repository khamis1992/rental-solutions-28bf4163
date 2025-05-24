
import { useState, useEffect, useMemo } from 'react';
import { generatePaymentSchedule, mergeActualWithScheduled, PaymentScheduleParams, ScheduledPayment } from '@/utils/payment-schedule-generator';
import { usePayments } from '@/hooks/use-payments';
import { Agreement } from '@/types/agreement';

interface UseUnifiedPaymentsProps {
  agreement: Agreement | null;
  showProjectedPayments?: boolean;
}

export function useUnifiedPayments({ 
  agreement, 
  showProjectedPayments = true 
}: UseUnifiedPaymentsProps) {
  const [scheduledPayments, setScheduledPayments] = useState<ScheduledPayment[]>([]);
  
  // Get actual payments from database
  const { 
    payments: actualPayments, 
    isLoading: isLoadingPayments,
    addPayment,
    updatePayment,
    deletePayment
  } = usePayments(agreement?.id);

  // Generate payment schedule based on agreement
  useEffect(() => {
    if (!agreement) {
      setScheduledPayments([]);
      return;
    }

    const scheduleParams: PaymentScheduleParams = {
      startDate: new Date(agreement.start_date),
      endDate: new Date(agreement.end_date),
      rentAmount: agreement.rent_amount || 0,
      paymentFrequency: 'monthly', // Default to monthly
      paymentDay: 1, // Default to 1st of month
      includeDeposit: false, // Deposit is usually handled separately
      depositAmount: 0
    };

    const generated = generatePaymentSchedule(scheduleParams);
    setScheduledPayments(generated);
  }, [agreement]);

  // Merge actual payments with scheduled payments
  const unifiedPayments = useMemo(() => {
    if (!showProjectedPayments) {
      return actualPayments.map(payment => ({
        id: payment.id,
        dueDate: new Date(payment.payment_date || payment.due_date),
        amount: payment.amount,
        description: payment.description || 'Payment',
        status: payment.status === 'completed' ? 'completed' as const : 
                payment.status === 'pending' ? 'pending' as const : 'overdue' as const,
        type: payment.type || 'rent' as const,
        isProjected: false
      }));
    }

    return mergeActualWithScheduled(scheduledPayments, actualPayments);
  }, [scheduledPayments, actualPayments, showProjectedPayments]);

  // Record payment for a projected payment
  const recordProjectedPayment = async (
    scheduledPayment: ScheduledPayment,
    actualAmount?: number,
    paymentDate?: Date
  ) => {
    if (!agreement) return;

    const paymentData = {
      lease_id: agreement.id,
      amount: actualAmount || scheduledPayment.amount,
      payment_date: (paymentDate || new Date()).toISOString(),
      due_date: scheduledPayment.dueDate.toISOString(),
      description: scheduledPayment.description,
      status: 'completed' as const,
      type: scheduledPayment.type,
      payment_method: 'cash' // Default payment method
    };

    return await addPayment(paymentData);
  };

  return {
    unifiedPayments,
    scheduledPayments,
    actualPayments,
    isLoading: isLoadingPayments,
    recordProjectedPayment,
    updatePayment,
    deletePayment,
    hasSchedule: scheduledPayments.length > 0,
    hasActualPayments: actualPayments.length > 0
  };
}
