
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { TrafficFine } from './types';
import { batchOperations } from '@/utils/promise/batch';
import { createLogger } from '@/utils/error-logger';
import { validateFineDate } from './use-traffic-fine-validation';

const logger = createLogger('traffic-fines:cleanup');

/**
 * Hook for managing traffic fine data quality and cleanup operations
 */
export function useTrafficFineCleanup(trafficFines?: TrafficFine[]) {
  const queryClient = useQueryClient();

  // Function to validate if the fine occurred within the lease period
  const isValidFine = (fine: TrafficFine) => {
    if (!fine.leaseId) return false;

    // Check if the fine has a violation date and the assigned lease has start/end dates
    if (!fine.violationDate || !fine.leaseStartDate) return false;

    const validation = validateFineDate(
      fine.violationDate,
      fine.leaseStartDate,
      fine.leaseEndDate
    );

    return validation.isValid;
  };

  // Function to clean up invalid assignments with improved batch processing
  const cleanupInvalidAssignments = useMutation({
    mutationFn: async (options: {
      batchSize?: number;
      concurrency?: number;
      vehicleId?: string;
      licensePlate?: string;
      leaseId?: string;
      silent?: boolean;
    } = {}) => {
      try {
        // If no traffic fines are provided, fetch only the ones relevant to the filter
        let finesToProcess = trafficFines;

        if (!finesToProcess || finesToProcess.length === 0 || options.vehicleId || options.licensePlate || options.leaseId) {
          logger.info('Fetching specific traffic fines for cleanup');

          let query = supabase.from('traffic_fines').select(`
            id,
            violation_date,
            lease_id,
            vehicle_id,
            license_plate,
            leases:lease_id (
              id,
              start_date,
              end_date
            )
          `);

          // Apply filters if provided
          if (options.vehicleId) {
            query = query.eq('vehicle_id', options.vehicleId);
          }

          if (options.licensePlate) {
            query = query.eq('license_plate', options.licensePlate);
          }

          if (options.leaseId) {
            query = query.eq('lease_id', options.leaseId);
          }

          // Only target assigned fines
          query = query.not('lease_id', 'is', null);

          const { data, error } = await query;

          if (error) {
            logger.error('Failed to fetch traffic fines:', error);
            throw error;
          }

          // Transform data to match TrafficFine structure
          finesToProcess = data?.map(fine => ({
            id: fine.id,
            violationDate: fine.violation_date,
            leaseId: fine.lease_id,
            leaseStartDate: fine.leases?.start_date,
            leaseEndDate: fine.leases?.end_date,
            // Add other fields as needed
          })) || [];

          logger.info(`Found ${finesToProcess.length} fines to check for invalid assignments`);
        }

        // Get all fines with invalid date ranges
        const invalidFines = finesToProcess.filter(fine => {
          if (!fine.leaseId || !fine.violationDate || !fine.leaseStartDate) return false;

          const validation = validateFineDate(
            fine.violationDate,
            fine.leaseStartDate,
            fine.leaseEndDate
          );

          return !validation.isValid;
        });

        if (invalidFines.length === 0) {
          logger.info('No invalid fine assignments found');
          return { cleaned: 0 };
        }

        logger.info(`Found ${invalidFines.length} invalid fine assignments to clean up`);

        const { batchSize = 10, concurrency = 3 } = options;

        // Process in batches with configurable concurrency
        const { data } = await batchOperations(
          invalidFines,
          async (fine) => {
            logger.debug(`Cleaning up assignment for fine ${fine.id}`);

            const { error } = await supabase
              .from('traffic_fines')
              .update({
                lease_id: null,
                assignment_status: 'pending'
              })
              .eq('id', fine.id);

            if (error) {
              logger.error(`Error updating fine ${fine.id}:`, error);
              throw error;
            }

            return { id: fine.id, success: true };
          },
          {
            batchSize,
            concurrency,
            continueOnError: true,
            onProgress: (status) => {
              if (status.completed % 5 === 0 || status.completed === invalidFines.length) {
                logger.info(`Cleanup progress: ${status.completed}/${invalidFines.length} items processed`);
              }
            }
          }
        );

        const successCount = data.results.filter(r => r.success).length;
        logger.info(`Cleanup completed: ${successCount}/${invalidFines.length} items successfully processed`);

        return { cleaned: successCount };
      } catch (error) {
        logger.error('Error cleaning up invalid assignments:', error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });

      // Only show toast notification if not silent mode
      if (!variables.silent && data.cleaned > 0) {
        toast({
          title: 'Cleanup successful',
          description: `Successfully cleaned up ${data.cleaned} invalid fine assignments`
        });
      }
    },
    onError: (error: Error, variables) => {
      // Only show toast notification if not silent mode
      if (!variables.silent) {
        toast({
          title: 'Cleanup failed',
          description: error.message,
          variant: 'destructive'
        });
      }
    }
  });

  // Bulk process a specific action on multiple fines
  const bulkProcessFines = useMutation({
    mutationFn: async ({
      fineIds,
      action,
      batchSize = 5,
      continueOnError = true
    }: {
      fineIds: string[];
      action: 'clear' | 'reassign' | 'markPaid';
      batchSize?: number;
      continueOnError?: boolean;
    }) => {
      if (!fineIds.length) return { processed: 0, failed: 0 };

      logger.info(`Starting bulk processing of ${fineIds.length} fines with action: ${action}`);

      // Create an array of async operations
      const operations = fineIds.map(id => {
        return async () => {
          logger.debug(`Processing fine ${id} with action ${action}`);

          // Define the update based on the action type
          let updateData = {};

          switch (action) {
            case 'clear':
              updateData = { lease_id: null, assignment_status: 'pending' };
              break;

            case 'markPaid':
              updateData = {
                payment_status: 'paid',
                payment_date: new Date().toISOString()
              };
              break;

            case 'reassign':
              // Reassignment requires more complex logic and should be handled separately
              throw new Error('Reassignment not supported in bulk operations');
          }

          const { error } = await supabase
            .from('traffic_fines')
            .update(updateData)
            .eq('id', id);

          if (error) {
            logger.error(`Error processing fine ${id}:`, error);
            throw new Error(`Failed to process fine ${id}: ${error.message}`);
          }

          return { id, success: true };
        };
      });

      // Process operations in batches
      const results = [];
      let processedCount = 0;

      // Process operations in batches with controlled concurrency
      for (let i = 0; i < operations.length; i += batchSize) {
        const batch = operations.slice(i, i + batchSize);

        const batchPromises = batch.map((operation) => {
          return (async () => {
            try {
              const result = await operation();
              return { ...result, success: true };
            } catch (error) {
              if (!continueOnError) {
                throw error;
              }

              return {
                error: error instanceof Error ? error.message : String(error),
                success: false
              };
            } finally {
              processedCount++;
            }
          })();
        });

        // Wait for this batch to complete
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add a small delay between batches
        if (i + batchSize < operations.length) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      const successCount = results.filter(result => result && result.success).length;
      const failedCount = fineIds.length - successCount;

      logger.info(`Bulk processing completed: ${successCount}/${fineIds.length} succeeded, ${failedCount} failed`);

      return {
        processed: fineIds.length,
        succeeded: successCount,
        failed: failedCount
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });

      if (result.failed > 0) {
        toast({
          title: 'Batch processing completed with errors',
          description: `Processed: ${result.succeeded}/${result.processed} fines, Failed: ${result.failed}`,
          variant: 'warning'
        });
      } else {
        toast({
          title: 'Batch processing completed',
          description: `Successfully processed ${result.succeeded} fines`
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Batch processing failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  return {
    cleanupInvalidAssignments,
    bulkProcessFines,
    isValidFine
  };
}
