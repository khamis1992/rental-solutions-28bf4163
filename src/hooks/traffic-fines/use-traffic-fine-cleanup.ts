
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { TrafficFine } from './use-traffic-fines-query';
import { batchOperations } from '@/utils/promise/batch';
import { processBatches } from '@/utils/concurrency-utils';

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
        
        // Get all fines with invalid date ranges
        const invalidFines = trafficFines.filter(fine => 
          fine.leaseId && fine.violationDate && fine.leaseStartDate && 
          (fine.violationDate < fine.leaseStartDate || 
           (fine.leaseEndDate && fine.violationDate > fine.leaseEndDate))
        );
        
        if (invalidFines.length === 0) {
          toast({
            title: 'No invalid fine assignments found',
            description: 'All traffic fines are properly assigned to valid lease periods'
          });
          return { cleaned: 0 };
        }
        
        console.log(`Found ${invalidFines.length} invalid fine assignments to clean up`);
        
        // Process in batches with controlled concurrency
        const { batchSize = 10, concurrency = 3 } = options;
        let processedCount = 0;
        
        await processBatches(
          invalidFines,
          batchSize,
          concurrency,
          async (fine) => {
            const { error } = await supabase
              .from('traffic_fines')
              .update({ 
                lease_id: null,
                assignment_status: 'pending'
              })
              .eq('id', fine.id);
            
            if (error) {
              console.error(`Error updating fine ${fine.id}:`, error);
              throw error;
            }
            
            processedCount++;
            return { id: fine.id, success: true };
          },
          (results, batchIndex) => {
            const successCount = results.filter(r => r && r.success).length;
            toast({
              title: `Batch ${batchIndex + 1} processed`,
              description: `Cleaned ${successCount}/${results.length} fine assignments in this batch`
            });
          }
        );
        
        return { cleaned: processedCount };
      } catch (error) {
        console.error('Error cleaning up invalid assignments:', error);
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
  
  // New function: Bulk process a specific action on multiple fines
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
      
      const operations = fineIds.map(id => {
        return async () => {
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
            
          if (error) throw new Error(`Failed to process fine ${id}: ${error.message}`);
          
          return { id, success: true };
        };
      });
      
      // Use batchOperations utility to process in groups with error handling
      const { data, error } = await batchOperations(
        operations,
        continueOnError
      );
      
      if (error) {
        throw error;
      }
      
      const successCount = data.filter(result => result && result.success).length;
      const failedCount = fineIds.length - successCount;
      
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
