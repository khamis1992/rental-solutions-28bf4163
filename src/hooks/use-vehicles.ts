import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useApiQuery, useApiMutation, useCrudApi } from '@/hooks/api/index';

export const useVehicles = () => {
  const queryClient = useQueryClient();
  const [vehicleId, setVehicleId] = useState<string | null>(null);

  // Fetch all vehicles
  const { data: vehicles, isLoading, error } = useQuery(
    'vehicles',
    async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*');
      if (error) {
        throw new Error(error.message);
      }
      return data;
    }
  );

  // Fetch single vehicle by ID
  const { data: vehicle, isLoading: isVehicleLoading, error: vehicleError } = useQuery(
    ['vehicle', vehicleId],
    async () => {
      if (!vehicleId) return null;
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    {
      enabled: !!vehicleId, // Only run when vehicleId is not null
    }
  );

  // Mutation to add a new vehicle
  const addVehicleMutation = useMutation(
    async (newVehicle: any) => {
      const { data, error } = await supabase
        .from('vehicles')
        .insert([newVehicle]);
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    {
      onSuccess: () => {
        // Invalidate and refetch
        queryClient.invalidateQueries('vehicles');
      },
    }
  );

  // Mutation to update a vehicle
  const updateVehicleMutation = useMutation(
    async ({ id, ...updates }: any) => {
      const { data, error } = await supabase
        .from('vehicles')
        .update(updates)
        .eq('id', id);
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    {
      onSuccess: () => {
        // Invalidate and refetch
        queryClient.invalidateQueries('vehicles');
        if (vehicleId) {
          queryClient.invalidateQueries(['vehicle', vehicleId]);
        }
      },
    }
  );

  // Function to set the vehicle ID for fetching a single vehicle
  const getVehicle = (id: string) => {
    setVehicleId(id);
  };

  return {
    vehicles,
    vehicle,
    isLoading,
    isVehicleLoading,
    error,
    vehicleError,
    addVehicleMutation,
    updateVehicleMutation,
    getVehicle,
  };
};
