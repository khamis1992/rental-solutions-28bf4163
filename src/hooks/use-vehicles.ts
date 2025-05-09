import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchVehicles, fetchVehicleById, updateVehicle, insertVehicle, deleteVehicle } from '@/lib/vehicles/vehicle-api';
import { toast } from 'sonner';
import { Vehicle, VehicleFilterParams } from '@/types/vehicle';
import { supabase } from '@/lib/supabase';

export function useVehicles() {
  // State to store filter parameters
  const [filters, setFilters] = useState<VehicleFilterParams>({});
  const queryClient = useQueryClient();

  // Query to fetch vehicles with current filters
  const { 
    data: vehicles = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['vehicles', filters],
    queryFn: () => fetchVehicles(filters),
  });

  // Individual vehicle retrieval hook
  const useVehicle = (id: string) => {
    return useQuery({
      queryKey: ['vehicle', id],
      queryFn: () => fetchVehicleById(id),
      enabled: !!id,
    });
  };

  // Vehicle creation mutation
  const useCreate = () => {
    return useMutation({
      mutationFn: insertVehicle,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      },
    });
  };

  // Vehicle update mutation
  const useUpdate = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: any }) => updateVehicle(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      },
    });
  };

  // Vehicle deletion mutation
  const useDelete = () => {
    return useMutation({
      mutationFn: deleteVehicle,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      },
    });
  };

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: VehicleFilterParams) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Setup real-time updates
  const useRealtimeUpdates = () => {
    useEffect(() => {
      const channel = supabase
        .channel('public:vehicles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, payload => {
          console.log('Real-time update:', payload);
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, []);
  };

  return {
    vehicles,
    isLoading,
    error,
    filters,
    handleFilterChange,
    clearFilters,
    // Custom hooks for specific operations
    useVehicle,
    useCreate,
    useUpdate,
    useDelete,
    useRealtimeUpdates
  };
}
