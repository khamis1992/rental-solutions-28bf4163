
import { useState, useEffect, useMemo } from 'react';
import { usePayments } from '@/hooks/use-payments';
import { Agreement } from '@/types/agreement';
import { PaymentScheduleService, PaymentScheduleItem } from '@/services/PaymentScheduleService';

interface UseUnifiedPaymentsProps {
  agreement: Agreement | null;
  showProjectedPayments?: boolean;
}

export function useUnifiedPayments({ 
  agreement, 
  showProjectedPayments = true 
}: UseUnifiedPaymentsProps) {
  const [scheduledPayments, setScheduledPayments] = useState<PaymentScheduleItem[]>([]);
  
  // Get actual payments from database
  const { 
    payments: actualPayments, 
    isLoading: isLoadingPayments,
    addPayment,
    updatePayment,
    deletePayment
  } = usePayments(agreement?.id);

  // Generate payment schedule when agreement changes
  useEffect(() => {
    if (!agreement) {
      setScheduledPayments([]);
      return;
    }

    console.log('Generating payment schedule for agreement:', agreement.id);
    const schedule = PaymentScheduleService.generateSchedule(agreement);
    setScheduledPayments(schedule);
  }, [agreement]);

  // Merge actual payments with scheduled payments
  const unifiedPayments = useMemo(() => {
    if (!showProjectedPayments) {
      return actualPayments.map(payment => ({
        id: payment.id,
        dueDate: new Date(payment.payment_date || payment.due_date || new Date()),
        amount: payment.amount || 0,
        description: payment.description || 'Payment',
        status: payment.status === 'completed' ? 'completed' as const : 
                payment.status === 'pending' ? 'pending' as const : 'overdue' as const,
        type: payment.type || 'rent' as const,
        isProjected: false
      }));
    }

    return PaymentScheduleService.mergeWithActualPayments(scheduledPayments, actualPayments);
  }, [scheduledPayments, actualPayments, showProjectedPayments]);

  // Record payment for a projected payment
  const recordProjectedPayment = async (
    scheduledPayment: PaymentScheduleItem,
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
      payment_method: 'cash'
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
