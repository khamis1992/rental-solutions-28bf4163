import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Agreement } from '@/types/agreement';
import { TrafficFine, TrafficFineCreatePayload, AssignFineParams, MarkPaidParams, DisputeFineParams } from '@/types/traffic-fine';
import { hasData, getErrorMessage } from '@/utils/supabase-response-helpers';

/**
 * Hook for fetching and managing traffic fine records
 */
export function useTrafficFines(agreementId?: string) {
  const queryClient = useQueryClient();

  // Fetch traffic fines for the specific agreement
  const {
    data: trafficFines = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['trafficFines', agreementId],
    queryFn: async () => {
      if (!agreementId) return [];

      const response = await supabase
        .from('traffic_fines')
        .select('*')
        .eq('lease_id', agreementId as any); // Type assertion to avoid incompatible string error

      if (!hasData(response)) {
        console.error('Error fetching traffic fines:', getErrorMessage(response));
        return [];
      }

      return response.data as TrafficFine[];
    },
    enabled: !!agreementId,
  });

  // Fetch all available agreements
  const {
    data: agreements = [],
    isLoading: isLoadingAgreements,
  } = useQuery({
    queryKey: ['trafficFineAgreements'],
    queryFn: async () => {
      const response = await supabase
        .from('leases')
        .select(`
          id,
          customer_id,
          start_date,
          end_date,
          profiles:customer_id(id, full_name)
        `)
        .in('status', ['active', 'pending'] as any); // Type assertion

      if (!hasData(response)) {
        console.error('Error fetching agreements:', getErrorMessage(response));
        return [];
      }

      // Convert to proper Agreement type with type assertion
      return response.data as unknown as Agreement[];
    },
  });

  // Add a traffic fine record
  const addTrafficFine = useMutation({
    mutationFn: async (fineData: TrafficFineCreatePayload) => {
      const response = await supabase
        .from('traffic_fines')
        .insert(fineData as any)
        .select('*')
        .single();

      if (!hasData(response)) {
        throw new Error(`Error creating traffic fine: ${getErrorMessage(response)}`);
      }

      return response.data as TrafficFine;
    },
    onSuccess: () => {
      toast.success('Traffic fine recorded successfully');
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
    },
    onError: (error) => {
      toast.error('Failed to record traffic fine: ' + (error as Error).message);
    },
  });

  // Update a traffic fine
  const updateTrafficFine = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TrafficFine> }) => {
      const response = await supabase
        .from('traffic_fines')
        .update(data as any)
        .eq('id', id as any)
        .select()
        .single();

      if (!hasData(response)) {
        throw new Error(`Error updating traffic fine: ${getErrorMessage(response)}`);
      }

      return response.data as TrafficFine;
    },
    onSuccess: () => {
      toast.success('Traffic fine updated successfully');
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
    },
    onError: (error) => {
      toast.error('Failed to update traffic fine: ' + (error as Error).message);
    },
  });

  // Delete a traffic fine
  const deleteTrafficFine = useMutation({
    mutationFn: async (id: string) => {
      const response = await supabase
        .from('traffic_fines')
        .delete()
        .eq('id', id as any);

      if (response.error) {
        throw new Error(`Error deleting traffic fine: ${response.error.message}`);
      }

      return id;
    },
    onSuccess: () => {
      toast.success('Traffic fine deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
    },
    onError: (error) => {
      toast.error('Failed to delete traffic fine: ' + (error as Error).message);
    },
  });

  // Mark a traffic fine as paid
  const markAsPaid = useMutation({
    mutationFn: async ({ id, paymentDate = new Date().toISOString() }: MarkPaidParams) => {
      const response = await supabase
        .from('traffic_fines')
        .update({
          payment_status: 'completed',
          payment_date: paymentDate,
        })
        .eq('id', id as any)
        .select()
        .single();

      if (!hasData(response)) {
        throw new Error(`Error updating payment status: ${getErrorMessage(response)}`);
      }

      return response.data as TrafficFine;
    },
    onSuccess: () => {
      toast.success('Traffic fine marked as paid');
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
    },
    onError: (error) => {
      toast.error('Failed to update payment status: ' + (error as Error).message);
    },
  });

  // Add dispute functionality
  const disputeTrafficFine = useMutation({
    mutationFn: async ({ id }: DisputeFineParams) => {
      const response = await supabase
        .from('traffic_fines')
        .update({
          payment_status: 'disputed',
        })
        .eq('id', id as any)
        .select()
        .single();

      if (!hasData(response)) {
        throw new Error(`Error disputing fine: ${getErrorMessage(response)}`);
      }

      return response.data as TrafficFine;
    },
    onSuccess: () => {
      toast.success('Traffic fine marked as disputed');
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
    },
    onError: (error) => {
      toast.error('Failed to dispute fine: ' + (error as Error).message);
    },
  });

  // Assign fine to customer
  const assignToCustomer = useMutation({
    mutationFn: async ({ id }: AssignFineParams) => {
      // First get the fine details to get license plate
      const fineResponse = await supabase
        .from('traffic_fines')
        .select('license_plate')
        .eq('id', id as any)
        .single();
      
      if (!hasData(fineResponse) || !fineResponse.data.license_plate) {
        throw new Error('Could not find license plate information');
      }
      
      // Find matching vehicle and agreement
      const vehicleResponse = await supabase
        .from('vehicles')
        .select('id')
        .eq('license_plate', fineResponse.data.license_plate)
        .single();
      
      if (!hasData(vehicleResponse)) {
        throw new Error('No vehicle found with this license plate');
      }
      
      // Find active agreement for this vehicle
      const agreementResponse = await supabase
        .from('leases')
        .select('id, customer_id, profiles:customer_id(full_name)')
        .eq('vehicle_id', vehicleResponse.data.id)
        .eq('status', 'active')
        .single();
      
      if (!hasData(agreementResponse)) {
        throw new Error('No active agreement found for this vehicle');
      }
      
      // Type assertion to ensure we can access the nested properties
      const profiles = agreementResponse.data.profiles as { full_name?: string } | null;
      const customerName = profiles?.full_name || 'Unknown';
      
      // Update the fine with customer and agreement information
      const updateResponse = await supabase
        .from('traffic_fines')
        .update({
          lease_id: agreementResponse.data.id,
          customer_id: agreementResponse.data.customer_id,
          customer_name: customerName,
          assignment_status: 'assigned'
        })
        .eq('id', id as any)
        .select()
        .single();
      
      if (!hasData(updateResponse)) {
        throw new Error(`Error assigning fine: ${getErrorMessage(updateResponse)}`);
      }
      
      return updateResponse.data as TrafficFine;
    },
    onSuccess: () => {
      toast.success('Fine assigned to customer successfully');
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
    },
    onError: (error) => {
      toast.error('Failed to assign fine: ' + (error as Error).message);
    }
  });

  // Add functionality to cleanup invalid assignments
  const cleanupInvalidAssignments = useMutation({
    mutationFn: async () => {
      // Get all fines with assignments
      const finesResponse = await supabase
        .from('traffic_fines')
        .select('id, lease_id, violation_date')
        .not('lease_id', 'is', null);
      
      if (!hasData(finesResponse)) {
        return { cleared: 0 };
      }
      
      const fines = finesResponse.data;
      const invalidFines = [];
      
      // Check each fine against lease dates
      for (const fine of fines) {
        if (!fine.lease_id || !fine.violation_date) continue;
        
        const leaseResponse = await supabase
          .from('leases')
          .select('start_date, end_date')
          .eq('id', fine.lease_id)
          .single();
        
        if (!hasData(leaseResponse)) continue;
        
        const violationDate = new Date(fine.violation_date);
        const startDate = new Date(leaseResponse.data.start_date);
        const endDate = leaseResponse.data.end_date ? new Date(leaseResponse.data.end_date) : new Date();
        
        // If violation date is outside lease period, mark for cleanup
        if (violationDate < startDate || violationDate > endDate) {
          invalidFines.push(fine.id);
        }
      }
      
      // Clear invalid assignments
      if (invalidFines.length > 0) {
        await supabase
          .from('traffic_fines')
          .update({
            lease_id: null,
            customer_id: null,
            customer_name: null,
            assignment_status: 'pending'
          })
          .in('id', invalidFines);
      }
      
      return { cleared: invalidFines.length };
    },
    onSuccess: (data) => {
      toast.success(`Cleared ${data.cleared} invalid fine assignments`);
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
    },
    onError: (error) => {
      toast.error('Failed to clean up invalid assignments: ' + (error as Error).message);
    }
  });

  const payTrafficFine = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const response = await supabase
        .from('traffic_fines')
        .update({
          payment_status: 'paid',
          payment_date: new Date().toISOString(),
        })
        .eq('id', id as any)
        .select()
        .single();

      if (!hasData(response)) {
        throw new Error(`Error paying fine: ${getErrorMessage(response)}`);
      }

      return response.data as TrafficFine;
    },
    onSuccess: () => {
      toast.success('Traffic fine marked as paid');
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
    },
    onError: (error) => {
      toast.error('Failed to pay fine: ' + (error as Error).message);
    },
  });

  return {
    trafficFines,
    isLoading,
    error,
    agreements,
    isLoadingAgreements,
    addTrafficFine,
    updateTrafficFine,
    deleteTrafficFine,
    markAsPaid,
    // Add the additional mutation functions
    payTrafficFine,
    disputeTrafficFine,
    assignToCustomer,
    cleanupInvalidAssignments,
  };
}

// Export the TrafficFine type for components to use
export type { TrafficFine, TrafficFineCreatePayload } from '@/types/traffic-fine';
