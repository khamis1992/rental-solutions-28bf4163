
import { useCallback, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Payment } from '@/types/payment.types';
import { usePaymentManagement } from './use-payment-management';
import { usePaymentScheduleManagement } from './use-payment-schedule-management';
import { useAgreementPaymentSync } from './use-agreement-payment-sync';
import { paymentService } from '@/services/PaymentService';
import { paymentScheduleService } from '@/services/PaymentScheduleService';
import { paymentSyncService } from '@/services/PaymentSyncService';
import { supabase } from '@/lib/supabase';

export interface SynchronizedPaymentData {
  payments: Payment[];
  paymentSchedule: any[];
  isLoading: boolean;
  isScheduleLoading: boolean;
  totalScheduled: number;
  totalPaid: number;
  pendingAmount: number;
  overdueCount: number;
}

export const useSynchronizedPaymentManagement = (agreementId?: string) => {
  const queryClient = useQueryClient();
  const [processingSync, setProcessingSync] = useState(false);
  
  // Use existing payment management hook
  const {
    payments,
    isLoading: isPaymentsLoading,
    addPayment,
    updatePayment,
    deletePayment,
    loadingStates: paymentLoadingStates
  } = usePaymentManagement(agreementId);

  // Use payment schedule management
  const {
    paymentSchedule,
    isLoading: isScheduleLoading,
    generatePaymentSchedule,
    updateScheduleItem,
    isPending: scheduleLoadingStates,
    refetch: fetchPaymentSchedule
  } = usePaymentScheduleManagement(agreementId);

  // Use payment sync functionality
  const {
    syncAll,
    isPending: syncLoadingStates
  } = useAgreementPaymentSync(agreementId);

  // Query to check synchronization status with better error handling
  const { data: syncStatus, refetch: refetchSyncStatus } = useQuery({
    queryKey: ['payment-sync-status', agreementId],
    queryFn: async () => {
      if (!agreementId) return null;
      
      try {
        // First check if we need to fix any issues using the PaymentSyncService
        const fixResult = await paymentSyncService.fixAgreementPaymentSync(agreementId);
        if (!fixResult.success) {
          console.warn('Payment sync fix had issues:', fixResult.error);
        }
        
        // Now get the actual sync status
        const [paymentsResult, scheduleResult] = await Promise.all([
          paymentService.getPayments(agreementId),
          paymentScheduleService.getPaymentSchedule(agreementId)
        ]);

        if (!paymentsResult.success || !scheduleResult.success) {
          return { 
            synchronized: false, 
            reason: 'Failed to fetch data',
            error: paymentsResult.error || scheduleResult.error
          };
        }

        const payments = paymentsResult.data || [];
        const schedule = scheduleResult.data || [];

        // Check if payment records exist for each schedule item
        const unsyncedItems = schedule.filter(scheduleItem => {
          return !payments.some(payment => 
            payment.schedule_id === scheduleItem.id ||
            (new Date(payment.payment_date || payment.created_at || '').getMonth() === 
             new Date(scheduleItem.due_date).getMonth() &&
             new Date(payment.payment_date || payment.created_at || '').getFullYear() === 
             new Date(scheduleItem.due_date).getFullYear())
          );
        });

        return {
          synchronized: unsyncedItems.length === 0,
          unsyncedCount: unsyncedItems.length,
          totalSchedule: schedule.length,
          totalPayments: payments.length
        };
      } catch (error) {
        console.error('Error checking sync status:', error);
        return { 
          synchronized: false, 
          reason: 'Error checking sync status', 
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    },
    enabled: !!agreementId,
    refetchInterval: 30000, // Check every 30 seconds
    retry: 2, // Only retry twice on failure
    retryDelay: 1000 // Wait 1 second between retries
  });

  // Auto-sync with better error handling
  const autoSyncMutation = useMutation({
    mutationFn: async () => {
      if (!agreementId) throw new Error('Agreement ID required');
      
      console.log('Auto-syncing payment data for agreement:', agreementId);
      setProcessingSync(true);
      
      try {
        // First, ensure we have a payment schedule
        const scheduleResult = await paymentScheduleService.getPaymentSchedule(agreementId);
        if (!scheduleResult.success || scheduleResult.data.length === 0) {
          console.log('No payment schedule found, will be created during sync');
        }
  
        // Run the comprehensive sync
        await syncAll();
        
        // Try to fix duplicate payments, but don't fail if this step fails
        try {
          const { data: fixResult, error: fixError } = await supabase.rpc('fix_duplicate_payments', { 
            p_lease_id: agreementId 
          });
          
          if (fixError) {
            console.warn('Error fixing duplicate payments (non-critical):', fixError);
          } else if (fixResult?.fixed_count > 0) {
            console.log(`Fixed ${fixResult.fixed_count} duplicate payments`);
            toast.info(`Fixed ${fixResult.fixed_count} duplicate payment records`);
          }
        } catch (duplicateFixError) {
          console.warn('Could not fix duplicate payments (continuing):', duplicateFixError);
        }
        
        return true;
      } finally {
        setProcessingSync(false);
      }
    },
    onSuccess: () => {
      toast.success('Payment data synchronized successfully');
      queryClient.invalidateQueries({ queryKey: ['payment-sync-status', agreementId] });
      queryClient.invalidateQueries({ queryKey: ['payments', agreementId] });
      queryClient.invalidateQueries({ queryKey: ['payment-schedule', agreementId] });
    },
    onError: (error) => {
      console.error('Auto-sync failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to synchronize payment data: ${errorMessage}`);
    }
  });

  // Trigger auto-sync if not synchronized
  const checkAndSync = useCallback(async () => {
    if (syncStatus && !syncStatus.synchronized && !autoSyncMutation.isPending && !processingSync) {
      console.log('Payment data not synchronized, triggering auto-sync');
      try {
        await autoSyncMutation.mutateAsync();
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    }
  }, [syncStatus, autoSyncMutation, processingSync]);
  
  // Auto-check synchronization on mount and when agreement changes
  useEffect(() => {
    if (agreementId && syncStatus && !syncStatus.synchronized && !processingSync) {
      console.log('Payment schedule not synchronized, will auto-sync');
      // Add a small delay to avoid immediate sync on component mount
      const timeoutId = setTimeout(() => {
        checkAndSync();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [agreementId, syncStatus, processingSync, checkAndSync]);

  // Calculate synchronized payment data
  const synchronizedData: SynchronizedPaymentData = {
    payments,
    paymentSchedule,
    isLoading: isPaymentsLoading,
    isScheduleLoading,
    totalScheduled: paymentSchedule.reduce((sum, item) => sum + (item.amount || 0), 0),
    totalPaid: payments
      .filter(p => p.status === 'completed' || p.status === 'paid')
      .reduce((sum, p) => sum + (p.amount || 0), 0),
    pendingAmount: payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + (p.amount || 0), 0),
    overdueCount: payments.filter(p => p.status === 'overdue').length
  };

  return {
    ...synchronizedData,
    
    // Synchronization status
    syncStatus,
    isSynchronized: syncStatus?.synchronized ?? false,
    
    // Payment operations
    addPayment,
    updatePayment,
    deletePayment,
    
    // Schedule operations
    generatePaymentSchedule,
    updateScheduleItem,
    
    // Sync operations
    syncAll,
    checkAndSync,
    autoSync: autoSyncMutation.mutateAsync,
    
    // Data refresh
    refetchSyncStatus,
    fetchPaymentSchedule,
    
    // Loading states
    loadingStates: {
      ...paymentLoadingStates,
      schedule: scheduleLoadingStates,
      sync: syncLoadingStates,
      autoSync: autoSyncMutation.isPending,
      processingSync
    }
  };
};
