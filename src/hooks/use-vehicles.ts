import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import React from 'react';

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year?: number;
  license_plate: string;
  color?: string;
  vin?: string;
  status?: string;
  insurance_company?: string;
  insurance_policy?: string;
  insurance_expiry?: string;
  documents_verified?: boolean;
  image_url?: string;
  vehicle_type_id?: string;
  created_at?: string;
  updated_at?: string;
  vehicleType?: {
    id: string;
    name: string;
    description?: string;
  };
}

export const useVehicles = () => {
  const queryClient = useQueryClient();

  const { data: vehicles, isLoading, error } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          vehicle_types(id, name, description)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching vehicles:', error);
        throw new Error(error.message);
      }

      // Map the data to include vehicleType property
      return data.map(vehicle => ({
        ...vehicle,
        vehicleType: vehicle.vehicle_types
      })) as Vehicle[];
    }
  });

  const addVehicle = useMutation({
    mutationFn: async (newVehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('vehicles')
        .insert([newVehicle])
        .select()
        .single();

      if (error) {
        console.error('Error adding vehicle:', error);
        throw new Error(error.message);
      }
      
      return data as Vehicle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Error adding vehicle: ${error.message}`);
    }
  });

  const updateVehicle = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Vehicle> }) => {
      const { data: updatedData, error } = await supabase
        .from('vehicles')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating vehicle:', error);
        throw new Error(error.message);
      }
      
      return updatedData as Vehicle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Error updating vehicle: ${error.message}`);
    }
  });

  const deleteVehicle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting vehicle:', error);
        throw new Error(error.message);
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Error deleting vehicle: ${error.message}`);
    }
  });

  const useRealtimeUpdates = () => {
    const queryClient = useQueryClient();
    
    React.useEffect(() => {
      const channel = supabase
        .channel('vehicles-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, () => {
          // Invalidate and refetch when data changes
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [queryClient]);
  };

  const useList = () => {
    return {
      data: vehicles,
      isLoading,
      error
    };
  };

  const useCreate = () => {
    return {
      mutate: (vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => {
        return addVehicle.mutateAsync(vehicleData);
      }
    };
  };

  return {
    vehicles,
    isLoading,
    error,
    addVehicle: addVehicle.mutateAsync,
    updateVehicle: updateVehicle.mutateAsync,
    deleteVehicle: deleteVehicle.mutateAsync,
    useRealtimeUpdates,
    useList,
    useCreate
  };
};
