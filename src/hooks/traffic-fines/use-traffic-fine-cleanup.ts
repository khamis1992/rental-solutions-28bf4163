
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { TrafficFine } from './use-traffic-fines-query';

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
  
  // Function to clean up invalid assignments
  const cleanupInvalidAssignments = useMutation({
    mutationFn: async () => {
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
        
        const invalidFineIds = invalidFines.map(fine => fine.id);
        
        console.log(`Cleaning up ${invalidFineIds.length} invalid fine assignments`);
        
        // Clear the lease_id for these fines
        const { error, count } = await supabase
          .from('traffic_fines')
          .update({ 
            lease_id: null,
            assignment_status: 'pending'
          })
          .in('id', invalidFineIds);
        
        if (error) {
          throw new Error(`Failed to clean up invalid assignments: ${error.message}`);
        }
        
        return { cleaned: invalidFineIds.length };
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

  return {
    cleanupInvalidAssignments,
    isValidFine
  };
}
