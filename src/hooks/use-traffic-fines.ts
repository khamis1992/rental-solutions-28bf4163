
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { TrafficFine } from '@/types/traffic-fine';
import { Agreement } from '@/types/agreement';
import { hasData } from '@/utils/supabase-response-helpers';

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

      const { data, error } = await supabase
        .from('traffic_fines')
        .select('*')
        .eq('lease_id', agreementId as any); // Type assertion to avoid incompatible string error

      if (error) {
        console.error('Error fetching traffic fines:', error);
        return [];
      }

      return data as TrafficFine[];
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
      const { data, error } = await supabase
        .from('leases')
        .select(`
          id,
          customer_id,
          start_date,
          end_date,
          profiles:customer_id(id, full_name)
        `)
        .in('status', ['active', 'pending'] as any); // Type assertion

      if (error) {
        console.error('Error fetching agreements:', error);
        return [];
      }

      return data as Agreement[];
    },
  });

  // Add a traffic fine record
  const addTrafficFine = useMutation({
    mutationFn: async (fineData: Omit<TrafficFine, 'id'>) => {
      const response = await supabase
        .from('traffic_fines')
        .insert(fineData)
        .select('*')
        .single();

      if (!hasData(response)) {
        throw new Error(`Error creating traffic fine: ${response?.error?.message || 'Unknown error'}`);
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
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<TrafficFine>;
    }) => {
      const response = await supabase
        .from('traffic_fines')
        .update(data)
        .eq('id', id as any) // Type assertion to avoid incompatible string error
        .select()
        .single();

      if (!hasData(response)) {
        throw new Error(`Error updating traffic fine: ${response?.error?.message || 'Unknown error'}`);
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
        .eq('id', id as any); // Type assertion to avoid incompatible string error

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
    mutationFn: async ({ id, paymentDate }: { id: string; paymentDate: string }) => {
      const response = await supabase
        .from('traffic_fines')
        .update({
          payment_status: 'completed',
          payment_date: paymentDate,
        })
        .eq('id', id as any) // Type assertion to avoid incompatible string error
        .select()
        .single();

      if (!hasData(response)) {
        throw new Error(`Error updating payment status: ${response?.error?.message || 'Unknown error'}`);
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

  return {
    trafficFines,
    isLoading,
    error,
    agreements,
    isLoadingAgreements,
    addTrafficFine: addTrafficFine.mutateAsync,
    updateTrafficFine: updateTrafficFine.mutateAsync,
    deleteTrafficFine: deleteTrafficFine.mutateAsync,
    markAsPaid: markAsPaid.mutateAsync,
  };
}
