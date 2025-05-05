
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { asVehicleId, asVehicleStatus } from '@/utils/database-type-helpers';

export function useVehicleStatus(vehicleId?: string) {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const updateStatus = async (newStatus: string) => {
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
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles', vehicleId] });
      
      return data;
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      toast.error('Failed to update vehicle status');
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateStatus,
    isUpdating
  };
}
