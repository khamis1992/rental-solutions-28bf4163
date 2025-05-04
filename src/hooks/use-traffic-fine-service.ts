
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TrafficFine } from '@/types/traffic-fine';
import { toast } from 'sonner';

export const useTrafficFineService = () => {
  const queryClient = useQueryClient();

  const findAll = async () => {
    const { data, error } = await supabase
      .from('traffic_fines')
      .select('*, vehicle:vehicles(make, model, color)');

    if (error) throw error;
    return data || [];
  };

  const findByCustomerId = async (customerId: string) => {
    const { data, error } = await supabase
      .from('traffic_fines')
      .select('*, vehicle:vehicles(make, model, color)')
      .eq('customer_id', customerId);

    if (error) throw error;
    return data || [];
  };

  const findByLeaseId = async (leaseId: string) => {
    const { data, error } = await supabase
      .from('traffic_fines')
      .select('*, vehicle:vehicles(make, model, color)')
      .eq('lease_id', leaseId);

    if (error) throw error;
    return data || [];
  };

  const updatePaymentStatus = async (id: string, status: string) => {
    const { data, error } = await supabase
      .from('traffic_fines')
      .update({ payment_status: status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const reassign = async (id: string, leaseId: string | null) => {
    const { data, error } = await supabase
      .from('traffic_fines')
      .update({ lease_id: leaseId })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const mutateUpdatePaymentStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      updatePaymentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
    },
  });

  const mutateReassign = useMutation({
    mutationFn: ({ id, leaseId }: { id: string; leaseId: string | null }) => 
      reassign(id, leaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
      toast.success("Fine reassigned successfully");
    },
    onError: (error) => {
      toast.error(`Failed to reassign fine: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });

  const trafficFineService = {
    findAll,
    findByCustomerId,
    findByLeaseId,
    updatePaymentStatus,
    reassign,
  };

  return {
    trafficFineService,
    updatePaymentStatus: mutateUpdatePaymentStatus,
    reassign: mutateReassign
  };
};
