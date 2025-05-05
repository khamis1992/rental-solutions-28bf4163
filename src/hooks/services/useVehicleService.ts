import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export interface VehicleFilters {
  statuses?: string[];
  search?: string;
  [key: string]: any;
}

export const useVehicleService = (initialFilters: VehicleFilters = {}) => {
  const [filters, setFilters] = useState<VehicleFilters>(initialFilters);
  const queryClient = useQueryClient();

  // Query for fetching vehicles with filters
  const {
    data: vehicles = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['vehicles', filters],
    queryFn: async () => {
      try {
        let query = supabase.from('vehicles').select('*');
        
        // Apply filters
        if (filters.statuses && filters.statuses.length > 0) {
          query = query.in('status', filters.statuses);
        }
        
        if (filters.search) {
          query = query.or(
            `make.ilike.%${filters.search}%,model.ilike.%${filters.search}%,license_plate.ilike.%${filters.search}%`
          );
        }

        const { data, error } = await query;
        if (error) throw error;
        
        return data;
      } catch (err) {
        console.error('Error fetching vehicles:', err);
        throw err;
      }
    }
  });

  // Get single vehicle details
  const getVehicleDetail = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching vehicle details:', err);
      throw err;
    }
  };

  // Mutation for updating vehicle 
  const updateVehicle = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Record<string, any> }) => {
      const { error } = await supabase
        .from('vehicles')
        .update(data)
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Vehicle updated successfully');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: (error) => {
      toast.error(`Failed to update vehicle: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Mutation for changing vehicle status
  const changeStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase
        .from('vehicles')
        .update({ status })
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: (error) => {
      toast.error(`Status update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Calculate utilization rate for a vehicle
  const calculateUtilization = async (id: string, startDate: Date, endDate: Date) => {
    try {
      // Implement calculation logic here based on your business needs
      // This is a placeholder
      return { utilizationRate: 0.75, daysUtilized: 23, totalDays: 30 };
    } catch (err) {
      console.error('Error calculating utilization:', err);
      throw err;
    }
  };

  return {
    vehicles,
    isLoading,
    error,
    filters,
    setFilters,
    refetch,
    vehicle: null, // Default value to avoid undefined errors
    getVehicleDetail,
    updateVehicle: updateVehicle.mutateAsync,
    changeStatus: changeStatus.mutateAsync,
    calculateUtilization,
    isPending: {
      updateVehicle: updateVehicle.isPending,
      changeStatus: changeStatus.isPending
    }
  };
};
