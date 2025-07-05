
import { useCallback, useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Payment } from '@/types/payment.types';
import { usePaymentManagement } from './use-payment-management';
import { usePaymentScheduleManagement } from './use-payment-schedule-management';
import { useAgreementPaymentSync } from './use-agreement-payment-sync';
import { paymentService } from '@/services/PaymentService';
import { paymentScheduleService } from '@/services/PaymentScheduleService';
import { paymentSyncService } from '@/services/PaymentSyncService';

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
  const lastSyncTime = useRef<number>(0);
  const syncInProgress = useRef<boolean>(false);
  
  // Debounce sync operations - only allow sync every 30 seconds
  const SYNC_COOLDOWN = 30000; // 30 seconds
  
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

  // Query to check synchronization status with better error handling and reduced frequency
  const { data: syncStatus, refetch: refetchSyncStatus } = useQuery({
    queryKey: ['payment-sync-status', agreementId],
    queryFn: async () => {
      if (!agreementId) return null;
      
      try {
        // Get the actual sync status
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
    refetchInterval: 60000, // Reduced frequency: Check every 60 seconds instead of 30
    retry: 1, // Reduced retries
    retryDelay: 2000,
    staleTime: 30000 // Consider data fresh for 30 seconds
  });

  // Auto-sync with better debouncing and error handling
  const autoSyncMutation = useMutation({
    mutationFn: async () => {
      if (!agreementId) throw new Error('Agreement ID required');
      
      // Check if sync is already in progress or too recent
      const now = Date.now();
      if (syncInProgress.current || (now - lastSyncTime.current) < SYNC_COOLDOWN) {
        console.log('Sync skipped: too recent or already in progress');
        return { skipped: true };
      }
      
      syncInProgress.current = true;
      lastSyncTime.current = now;
      
      console.log('Auto-syncing payment data for agreement:', agreementId);
      setProcessingSync(true);
      
      try {
        // Use the enhanced PaymentSyncService for comprehensive fix
        const result = await paymentSyncService.fixAgreementPaymentSync(agreementId);
        
        if (!result.success) {
          throw new Error(result.error?.toString() || 'Failed to sync payments');
        }
        
        console.log('Payment sync completed successfully:', result.data);
        return result.data;
      } finally {
        setProcessingSync(false);
        syncInProgress.current = false;
      }
    },
    onSuccess: (data) => {
      // Only show success notification if sync actually did something
      if (data && !data.skipped && (data.scheduleItems > 0 || data.unifiedPaymentsCreated > 0)) {
        toast.success(`Payment data synchronized! Created ${data.scheduleItems} schedule items and ${data.unifiedPaymentsCreated} payment records.`);
      }
      queryClient.invalidateQueries({ queryKey: ['payment-sync-status', agreementId] });
      queryClient.invalidateQueries({ queryKey: ['payments', agreementId] });
      queryClient.invalidateQueries({ queryKey: ['payment-schedule', agreementId] });
    },
    onError: (error) => {
      console.error('Auto-sync failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Only show error notification for actual errors, not skipped syncs
      if (!errorMessage.includes('skipped')) {
        toast.error(`Failed to synchronize payment data: ${errorMessage}`);
      }
    }
  });

  // Trigger auto-sync with better conditions
  const checkAndSync = useCallback(async () => {
    if (!syncStatus || syncStatus.synchronized || autoSyncMutation.isPending || processingSync) {
      return;
    }
    
    // Only sync if there are actually unsynced items and it's been a while
    const now = Date.now();
    if (syncStatus.unsyncedCount > 0 && (now - lastSyncTime.current) >= SYNC_COOLDOWN) {
      console.log('Payment schedule not synchronized, triggering auto-sync');
      try {
        await autoSyncMutation.mutateAsync();
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    }
  }, [syncStatus, autoSyncMutation, processingSync]);
  
  // Auto-check synchronization with better debouncing
  useEffect(() => {
    if (!agreementId || !syncStatus || syncStatus.synchronized || processingSync) {
      return;
    }

    // Add a longer delay to prevent immediate sync on component mount
    const timeoutId = setTimeout(() => {
      checkAndSync();
    }, 5000); // Increased delay to 5 seconds
    
    return () => clearTimeout(timeoutId);
  }, [agreementId, syncStatus?.synchronized, syncStatus?.unsyncedCount, processingSync, checkAndSync]);

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
