
import { useTrafficFinesQuery } from './use-traffic-fines-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validateFineDate, findBestMatchingLease } from './use-traffic-fine-validation';

export type TrafficFine = {
  id: string;
  violationNumber: string;
  licensePlate?: string;
  violationDate: Date;
  fineAmount: number;
  violationCharge?: string;
  paymentStatus: string;
  location?: string;
  vehicleId?: string;
  customerId?: string;
  customerName?: string;
  leaseId?: string;
  leaseStartDate?: Date;
  leaseEndDate?: Date;
};

export type TrafficFineStatusType = 'pending' | 'paid' | 'disputed';

export type TrafficFinePayload = {
  id: string;
};

export type TrafficFineCreatePayload = {
  violationNumber: string;
  licensePlate: string;
  violationDate: Date | string;
  fineAmount: number;
  violationCharge?: string;
  location?: string;
};

export function useTrafficFines() {
  const queryClient = useQueryClient();
  const { data: trafficFines, isLoading, error } = useTrafficFinesQuery();

  /**
   * Pay a traffic fine
   */
  const payTrafficFine = useMutation({
    mutationFn: async (payload: TrafficFinePayload) => {
      const { data, error } = await supabase
        .from('traffic_fines')
        .update({ payment_status: 'paid', payment_date: new Date().toISOString() })
        .eq('id', payload.id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
      toast.success('Traffic fine marked as paid');
    },
    onError: (error: any) => {
      toast.error('Failed to update fine status', {
        description: error.message
      });
    }
  });

  /**
   * Dispute a traffic fine
   */
  const disputeTrafficFine = useMutation({
    mutationFn: async (payload: TrafficFinePayload) => {
      const { data, error } = await supabase
        .from('traffic_fines')
        .update({ payment_status: 'disputed' })
        .eq('id', payload.id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
      toast.success('Traffic fine marked as disputed');
    },
    onError: (error: any) => {
      toast.error('Failed to dispute fine', {
        description: error.message
      });
    }
  });

  /**
   * Create a new traffic fine with automatic validation and assignment
   */
  const createTrafficFine = useMutation({
    mutationFn: async (payload: TrafficFineCreatePayload) => {
      // First, try to find a matching lease for automatic assignment
      const { leaseId, reason } = await findBestMatchingLease(
        payload.licensePlate,
        payload.violationDate
      );
      
      // Prepare the fine data
      const fineData = {
        violation_number: payload.violationNumber,
        license_plate: payload.licensePlate,
        violation_date: new Date(payload.violationDate).toISOString(),
        fine_amount: payload.fineAmount,
        violation_charge: payload.violationCharge || 'Traffic Violation',
        fine_location: payload.location || 'Unknown',
        payment_status: 'pending',
        lease_id: leaseId,
        assignment_status: leaseId ? 'assigned' : 'pending'
      };
      
      // Insert the fine
      const { data, error } = await supabase
        .from('traffic_fines')
        .insert(fineData)
        .select()
        .single();
        
      if (error) throw error;
      
      // Return the result with assignment info
      return {
        fine: data,
        assigned: !!leaseId,
        assignmentMessage: leaseId 
          ? 'Fine automatically assigned to customer' 
          : `Fine not assigned: ${reason}`
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
      
      toast.success('Traffic fine created successfully', {
        description: result.assigned 
          ? 'Fine was automatically assigned to a customer' 
          : 'Fine was recorded but couldn\'t be assigned automatically'
      });
    },
    onError: (error: any) => {
      toast.error('Failed to create traffic fine', {
        description: error.message
      });
    }
  });

  /**
   * Assign a traffic fine to a customer
   */
  const assignToCustomer = useMutation({
    mutationFn: async (payload: TrafficFinePayload) => {
      // Get the fine details first
      const { data: fine, error: fineError } = await supabase
        .from('traffic_fines')
        .select('id, license_plate, violation_date')
        .eq('id', payload.id)
        .single();
        
      if (fineError || !fine) {
        throw new Error(`Failed to retrieve fine details: ${fineError?.message || 'Fine not found'}`);
      }
      
      if (!fine.license_plate) {
        throw new Error('Fine record is missing license plate information');
      }
      
      // Find the best matching lease
      const { leaseId, reason } = await findBestMatchingLease(
        fine.license_plate,
        fine.violation_date
      );
      
      if (!leaseId) {
        throw new Error(`Cannot assign fine: ${reason}`);
      }
      
      // Get lease information for validation
      const { data: lease, error: leaseError } = await supabase
        .from('leases')
        .select('id, start_date, end_date, customer_id')
        .eq('id', leaseId)
        .single();
        
      if (leaseError || !lease) {
        throw new Error(`Failed to retrieve lease details: ${leaseError?.message || 'Lease not found'}`);
      }
      
      // Double check with the improved validation logic
      const validation = validateFineDate(
        fine.violation_date,
        lease.start_date,
        lease.end_date
      );
      
      if (!validation.isValid) {
        throw new Error(`Cannot assign fine: ${validation.reason}`);
      }
      
      // Update the fine with the validated lease assignment
      const { data: updatedFine, error: updateError } = await supabase
        .from('traffic_fines')
        .update({ 
          lease_id: leaseId,
          assignment_status: 'assigned'
        })
        .eq('id', payload.id)
        .select()
        .single();
        
      if (updateError) {
        throw new Error(`Failed to update fine assignment: ${updateError.message}`);
      }
      
      return { 
        fine: updatedFine, 
        customer_id: lease.customer_id
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
      toast.success('Fine assigned to customer successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to assign fine', {
        description: error.message || 'An error occurred while assigning the fine'
      });
    }
  });

  /**
   * Clean up invalid fine-to-lease assignments
   */
  const cleanupInvalidAssignments = useMutation({
    mutationFn: async () => {
      // Only process fines that have both lease and violation dates
      const fines = trafficFines?.filter(fine => 
        fine.leaseId && fine.violationDate && fine.leaseStartDate
      ) || [];
      
      const invalidFines = fines.filter(fine => {
        const validation = validateFineDate(
          fine.violationDate,
          fine.leaseStartDate,
          fine.leaseEndDate
        );
        return !validation.isValid;
      });
      
      if (invalidFines.length === 0) {
        return { processed: 0, message: 'No invalid assignments found' };
      }
      
      const results = [];
      
      // Process each invalid assignment
      for (const fine of invalidFines) {
        try {
          // Unassign the fine from the current lease
          const { error } = await supabase
            .from('traffic_fines')
            .update({ 
              lease_id: null,
              assignment_status: 'pending'
            })
            .eq('id', fine.id);
          
          results.push({
            id: fine.id,
            success: !error,
            error: error?.message
          });
          
        } catch (error) {
          results.push({
            id: fine.id,
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      return {
        processed: invalidFines.length,
        fixed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
      
      if (result.fixed > 0) {
        toast.success(`Fixed ${result.fixed} invalid assignments`, {
          description: `${result.failed} assignments failed to be fixed`
        });
      } else {
        toast.info(result.message || 'No changes were made');
      }
    },
    onError: (error: any) => {
      toast.error('Failed to clean up invalid assignments', {
        description: error.message
      });
    }
  });

  return {
    trafficFines,
    isLoading,
    error,
    payTrafficFine,
    disputeTrafficFine,
    createTrafficFine,
    assignToCustomer,
    cleanupInvalidAssignments
  };
}

// Export types for external use
export { TrafficFineStatusType, TrafficFine, TrafficFinePayload, TrafficFineCreatePayload };
