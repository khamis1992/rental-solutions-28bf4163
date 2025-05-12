
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { asVehicleId, asVehicleStatus } from '@/utils/database-type-helpers';

export function useVehicleStatus(vehicleId?: string) {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  // Use React Query mutation for status updates
  const { mutate: updateStatus } = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!vehicleId) {
        throw new Error('Vehicle ID is required');
      }
      
      setIsUpdating(true);
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .update({ 
            status: asVehicleStatus(newStatus),
            updated_at: new Date().toISOString()
          })
          .eq('id', asVehicleId(vehicleId))
          .select()
          .single();
        
        if (error) throw error;
        
        return data;
      } catch (error) {
        console.error('Error updating vehicle status:', error);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    onSuccess: () => {
      // Only invalidate the specific vehicle query
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleId] });
      toast.success(`Vehicle status updated successfully`);
    },
    onError: (error) => {
      toast.error('Failed to update vehicle status');
      console.error('Error updating vehicle status:', error);
    }
  });

  return {
    updateStatus,
    isUpdating
  };
}
