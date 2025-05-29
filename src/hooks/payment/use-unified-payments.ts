
import { useState, useEffect, useMemo } from 'react';
import { usePayments } from '@/hooks/use-payments';
import { Agreement } from '@/types/agreement';
import { PaymentScheduleItem } from '@/services/PaymentScheduleService';
import { usePaymentScheduleManagement } from './use-payment-schedule-management';
import { useAgreementPaymentSync } from './use-agreement-payment-sync';

interface UseUnifiedPaymentsProps {
  agreement: Agreement | null;
  showProjectedPayments?: boolean;
}

interface UnifiedPaymentItem {
  id: string;
  dueDate: Date;
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'overdue';
  type: string;
  isProjected: boolean;
}

export function useUnifiedPayments({ 
  agreement, 
  showProjectedPayments = true 
}: UseUnifiedPaymentsProps) {
  
  // Get actual payments from database
  const { 
    payments: actualPayments, 
    isLoading: isLoadingPayments,
    addPayment,
    updatePayment,
    deletePayment
  } = usePayments(agreement?.id || '');

  // Get scheduled payments and sync
  const {
    paymentSchedule: scheduledPayments,
    isLoading: isLoadingSchedule
  } = usePaymentScheduleManagement(agreement?.id);

  // Auto-sync payment schedules
  const { needsScheduleGeneration } = useAgreementPaymentSync({
    agreement,
    autoGenerate: true
  });

  // Merge actual payments with scheduled payments
  const unifiedPayments = useMemo(() => {
    if (!showProjectedPayments) {
      return actualPayments.map(payment => ({
        id: payment.id || '',
        dueDate: new Date(payment.payment_date || payment.due_date || new Date()),
        amount: payment.amount || 0,
        description: payment.description || 'Payment',
        status: payment.status === 'completed' ? 'completed' as const : 
                payment.status === 'pending' ? 'pending' as const : 'overdue' as const,
        type: payment.type || 'rent',
        isProjected: false
      }));
    }

    const items: UnifiedPaymentItem[] = [];

    // Add scheduled payments
    scheduledPayments.forEach(schedule => {
      // Check if there's a corresponding actual payment
      const matchingPayment = actualPayments.find(payment => {
        const paymentMonth = new Date(payment.payment_date || payment.created_at || '').getMonth();
        const scheduleMonth = new Date(schedule.due_date).getMonth();
        const paymentYear = new Date(payment.payment_date || payment.created_at || '').getFullYear();
        const scheduleYear = new Date(schedule.due_date).getFullYear();
        
        return paymentMonth === scheduleMonth && paymentYear === scheduleYear;
      });

      items.push({
        id: schedule.id || `schedule-${Date.now()}`,
        dueDate: new Date(schedule.due_date),
        amount: schedule.amount,
        description: schedule.description || 'Scheduled payment',
        status: matchingPayment ? 'completed' : schedule.status as 'pending' | 'completed' | 'overdue',
        type: 'rent',
        isProjected: !matchingPayment
      });
    });

    // Add actual payments that don't have corresponding schedule items
    actualPayments.forEach(payment => {
      const hasScheduleItem = scheduledPayments.some(schedule => {
        const paymentMonth = new Date(payment.payment_date || payment.created_at || '').getMonth();
        const scheduleMonth = new Date(schedule.due_date).getMonth();
        const paymentYear = new Date(payment.payment_date || payment.created_at || '').getFullYear();
        const scheduleYear = new Date(schedule.due_date).getFullYear();
        
        return paymentMonth === scheduleMonth && paymentYear === scheduleYear;
      });

      if (!hasScheduleItem) {
        items.push({
          id: payment.id || `payment-${Date.now()}`,
          dueDate: new Date(payment.payment_date || payment.created_at || ''),
          amount: payment.amount || 0,
          description: payment.description || 'Unscheduled payment',
          status: payment.status === 'completed' ? 'completed' : 
                  payment.status === 'pending' ? 'pending' : 'overdue',
          type: payment.type || 'rent',
          isProjected: false
        });
      }
    });

    return items.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
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
      due_date: scheduledPayment.due_date,
      description: scheduledPayment.description,
      status: 'completed' as const,
      type: 'rent',
      payment_method: 'cash'
    };

    return await addPayment(paymentData);
  };

  return {
    unifiedPayments,
    scheduledPayments,
    actualPayments,
    isLoading: isLoadingPayments || isLoadingSchedule,
    recordProjectedPayment,
    updatePayment,
    deletePayment,
    hasSchedule: scheduledPayments.length > 0,
    hasActualPayments: actualPayments.length > 0,
    needsScheduleGeneration
  };
}
