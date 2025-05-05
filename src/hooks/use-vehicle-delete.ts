
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { asVehicleId } from '@/utils/database-type-helpers';

export function useVehicleDelete() {
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const deleteVehicle = async (id: string) => {
    if (!id) {
      throw new Error('Vehicle ID is required');
    }
    
    setIsDeleting(true);
    try {
      // Check if the vehicle is linked to any active agreements
      const { data: leases, error: leaseError } = await supabase
        .from('leases')
        .select('id')
        .eq('vehicle_id', id)
        .eq('status', 'active')
        .limit(1);
      
      if (leaseError) throw leaseError;
      
      if (leases && leases.length > 0) {
        throw new Error('Cannot delete vehicle that has active rental agreements');
      }
      
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', asVehicleId(id));
      
      if (error) throw error;
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      
      toast.success('Vehicle deleted successfully');
      return id;
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete vehicle');
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteVehicle,
    isDeleting
  };
}
