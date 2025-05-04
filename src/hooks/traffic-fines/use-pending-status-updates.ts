
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useErrorNotification } from '@/hooks/use-error-notification';
import { ConfirmStatusUpdateProps, PendingStatusUpdate } from './types';

/**
 * Hook for managing pending traffic fine status updates
 */
export const usePendingStatusUpdates = () => {
  const [pendingUpdates, setPendingUpdates] = useState<PendingStatusUpdate[]>([]);
  const queryClient = useQueryClient();
  const errorNotification = useErrorNotification();

  // Add a pending update
  const addPendingUpdate = (update: PendingStatusUpdate) => {
    setPendingUpdates(prev => {
      // Remove any existing pending update for this fine
      const filtered = prev.filter(u => u.id !== update.id);
      // Add the new pending update
      return [...filtered, update];
    });
    
    toast.info('Confirmation Required', {
      description: `Fine with license plate ${update.licensePlate} can be marked as paid. Please confirm this action.`,
      duration: 5000
    });
  };

  // Apply a single pending update
  const confirmStatusUpdate = useMutation({
    mutationFn: async ({ id }: ConfirmStatusUpdateProps) => {
      try {
        // Find the pending update
        const pendingUpdate = pendingUpdates.find(update => update.id === id);

        if (!pendingUpdate) {
          throw new Error('No pending update found for this fine');
        }

        // Apply the update
        const { error: updateError } = await supabase
          .from('traffic_fines')
          .update({
            payment_status: 'paid',
            payment_date: new Date().toISOString()
          })
          .eq('id', id);

        if (updateError) {
          throw new Error(`Failed to update fine status: ${updateError.message}`);
        }

        // Remove from pending updates
        setPendingUpdates(prev => prev.filter(update => update.id !== id));

        return { success: true, fineId: id };
      } catch (error) {
        console.error('Error confirming status update:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Fine status updated', {
        description: 'Fine has been marked as paid'
      });
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
    },
    onError: (error) => {
      errorNotification.showError('Status Update Failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        id: 'confirm-update-error'
      });
    }
  });

  // Apply all pending updates
  const confirmAllStatusUpdates = useMutation({
    mutationFn: async () => {
      try {
        if (pendingUpdates.length === 0) {
          return { success: true, updated: 0 };
        }

        const results = [];

        // Process each pending update
        for (const update of pendingUpdates) {
          try {
            const { error: updateError } = await supabase
              .from('traffic_fines')
              .update({
                payment_status: 'paid',
                payment_date: new Date().toISOString()
              })
              .eq('id', update.id);

            results.push({
              id: update.id,
              success: !updateError,
              error: updateError ? updateError.message : undefined
            });
          } catch (error) {
            results.push({
              id: update.id,
              success: false,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }

        // Clear all pending updates
        setPendingUpdates([]);

        const successCount = results.filter(r => r.success).length;

        return {
          success: true,
          updated: successCount,
          total: pendingUpdates.length,
          results
        };
      } catch (error) {
        console.error('Error confirming all status updates:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success('Batch update completed', {
        description: `${data.updated} of ${data.total} fines have been marked as paid`
      });
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
    },
    onError: (error) => {
      errorNotification.showError('Batch Update Failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        id: 'confirm-all-error'
      });
    }
  });

  // Dismiss a pending update without applying it
  const dismissStatusUpdate = (id: string) => {
    setPendingUpdates(prev => prev.filter(update => update.id !== id));
    toast('Update dismissed', {
      description: 'The fine status will remain unchanged'
    });
  };

  // Dismiss all pending updates
  const dismissAllStatusUpdates = () => {
    setPendingUpdates([]);
    toast('All updates dismissed', {
      description: 'No changes have been made to fine statuses'
    });
  };

  return {
    pendingUpdates,
    addPendingUpdate,
    confirmStatusUpdate,
    confirmAllStatusUpdates,
    dismissStatusUpdate,
    dismissAllStatusUpdates
  };
};
