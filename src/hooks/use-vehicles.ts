
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Vehicle, VehicleType, VehicleStatus, VehicleFilterParams, VehicleInsertData, VehicleUpdateData, DatabaseVehicleRecord } from '@/types/vehicle';

// Define a complete DatabaseVehicleRecord type to match what we get from the database
interface CompleteDBVehicleRecord extends DatabaseVehicleRecord {
  created_at: string;
  updated_at: string;
}

// Helper function to map database record to frontend Vehicle type
const mapDatabaseRecordToVehicle = (record: CompleteDBVehicleRecord): Vehicle => {
  return {
    id: record.id,
    make: record.make,
    model: record.model,
    year: record.year,
    license_plate: record.license_plate,
    vin: record.vin,
    color: record.color || undefined,
    status: record.status || undefined, 
    mileage: record.mileage || undefined,
    image_url: record.image_url || undefined,
    description: record.description || undefined,
    location: record.location || undefined,
    insurance_company: record.insurance_company || undefined,
    insurance_expiry: record.insurance_expiry || undefined,
    device_type: record.device_type || undefined,
    rent_amount: record.rent_amount || undefined,
    vehicle_type_id: record.vehicle_type_id || undefined,
    registration_number: record.registration_number || undefined,
    created_at: record.created_at,
    updated_at: record.updated_at,
    is_test_data: record.is_test_data || false
  };
};

export const useVehicles = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<VehicleFilterParams>({});

  // Fetch list of vehicles with filters
  const fetchVehicles = async () => {
    let query = supabase
      .from('vehicles')
      .select('*');

    // Apply filters if they exist
    if (filters.status && filters.status !== 'all') {
      // Handle reserved as a special case for "reserve" status in DB
      const dbStatus = filters.status === 'reserved' ? 'reserve' : filters.status;
      query = query.eq('status', dbStatus);
    }
    
    if (filters.make && filters.make !== 'all') {
      query = query.eq('make', filters.make);
    }
    
    if (filters.location && filters.location !== 'all') {
      query = query.eq('location', filters.location);
    }
    
    if (filters.year && filters.year !== 'all') {
      query = query.eq('year', parseInt(filters.year));
    }
    
    if (filters.vehicle_type_id && filters.vehicle_type_id !== 'all') {
      query = query.eq('vehicle_type_id', filters.vehicle_type_id);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    // Map database records to Vehicle types
    return data?.map(item => mapDatabaseRecordToVehicle(item as CompleteDBVehicleRecord)) || [];
  };

  // Query hook for list of vehicles
  const useList = () => {
    return useQuery({
      queryKey: ['vehicles', 'list', filters],
      queryFn: fetchVehicles,
      staleTime: 60000,
      refetchOnWindowFocus: false,
    });
  };

  // Query hook for vehicle types
  const useVehicleTypes = () => {
    const fetchVehicleTypes = async () => {
      const { data, error } = await supabase
        .from('vehicle_types')
        .select('*')
        .eq('is_active', true);
        
      if (error) throw error;
      return data as VehicleType[];
    };

    return useQuery({
      queryKey: ['vehicles', 'types'],
      queryFn: fetchVehicleTypes,
      staleTime: 300000,  // Cache for 5 minutes
      refetchOnWindowFocus: false,
    });
  };

  // Query hook for a single vehicle by ID
  const useVehicleDetails = (vehicleId?: string) => {
    const fetchVehicleDetails = async () => {
      if (!vehicleId) {
        return null;
      }

      const { data, error } = await supabase
        .from('vehicles')
        .select('*, vehicle_types (*)')
        .eq('id', vehicleId)
        .maybeSingle();
        
      if (error) throw error;
      if (!data) return null;

      // Map the database record to our frontend type
      return mapDatabaseRecordToVehicle(data as CompleteDBVehicleRecord);
    };

    return useQuery({
      queryKey: ['vehicles', 'detail', vehicleId],
      queryFn: fetchVehicleDetails,
      staleTime: 30000,
      refetchOnWindowFocus: false,
      enabled: !!vehicleId,
    });
  };

  // Set up realtime updates for vehicles
  const useRealtimeUpdates = () => {
    const queryClient = useQueryClient();

    return {
      subscribe: () => {
        const subscription = supabase
          .channel('vehicle-changes')
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'vehicles'
          }, (payload) => {
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
          })
          .subscribe();

        return () => {
          supabase.removeChannel(subscription);
        };
      }
    };
  };

  // Create a new vehicle
  const createVehicleMutation = useMutation({
    mutationFn: async (newVehicle: VehicleInsertData) => {
      const { data, error } = await supabase
        .from('vehicles')
        .insert(newVehicle)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });

  // Update a vehicle
  const updateVehicleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: VehicleUpdateData }) => {
      const { error } = await supabase
        .from('vehicles')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles', 'list'] });
    },
  });

  // Delete a vehicle
  const deleteVehicleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });

  return {
    filters,
    setFilters,
    useList,
    useVehicleTypes,
    useVehicleDetails,
    useRealtimeUpdates,
    createVehicle: createVehicleMutation.mutate,
    updateVehicle: updateVehicleMutation.mutate,
    deleteVehicle: deleteVehicleMutation.mutate,
    createVehicleLoading: createVehicleMutation.isPending,
    updateVehicleLoading: updateVehicleMutation.isPending,
    deleteVehicleLoading: deleteVehicleMutation.isPending,
  };
};
