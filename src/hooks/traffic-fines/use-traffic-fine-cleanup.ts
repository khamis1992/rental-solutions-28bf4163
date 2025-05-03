
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { TrafficFine } from './use-traffic-fines-query';
import { batchOperations } from '@/utils/promise/batch';
import { createLogger } from '@/utils/error-logger';

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
    
    const violationDate = new Date(fine.violationDate);
    const leaseStartDate = new Date(fine.leaseStartDate);
    const leaseEndDate = fine.leaseEndDate ? new Date(fine.leaseEndDate) : new Date();
    
    return violationDate >= leaseStartDate && violationDate <= leaseEndDate;
  };
  
  // Function to clean up invalid assignments with improved batch processing
  const cleanupInvalidAssignments = useMutation({
    mutationFn: async (options: { batchSize?: number; concurrency?: number } = {}) => {
      try {
        if (!trafficFines || trafficFines.length === 0) {
          throw new Error('No traffic fines data available');
        }
        
        logger.info('Starting invalid assignment cleanup...');
        
        // Get all fines with invalid date ranges
        const invalidFines = trafficFines.filter(fine => 
          fine.leaseId && fine.violationDate && fine.leaseStartDate && 
          (fine.violationDate < fine.leaseStartDate || 
           (fine.leaseEndDate && fine.violationDate > fine.leaseEndDate))
        );
        
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
      toast({
        title: 'Cleanup successful',
        description: `Successfully cleaned up ${data.cleaned} invalid fine assignments`
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Cleanup failed',
        description: error.message,
        variant: 'destructive'
      });
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
