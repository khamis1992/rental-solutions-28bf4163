import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Vehicle, VehicleFilterParams, DatabaseVehicleRecord } from '@/types/vehicle';
import { useState, useEffect } from 'react';

// Similar to useVehicles but with pagination
export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export const useVehiclesPagination = (pagination: PaginationState, filters?: VehicleFilterParams) => {
  const [totalCount, setTotalCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);

  // Here we modify to include correct typing for VehicleType
  const mapVehicleFromDatabase = (record: any): Vehicle => {
    const vehicleType = record.vehicle_types || null;
    
    return {
      id: record.id,
      make: record.make,
      model: record.model, 
      year: record.year,
      license_plate: record.license_plate,
      vin: record.vin || "", // Providing default values for required fields
      status: record.status,
      image_url: record.image_url,
      location: record.location,
      mileage: record.mileage,
      vehicleType: vehicleType ? {
        id: vehicleType.id,
        name: vehicleType.name,
        description: vehicleType.description || '',
        size: vehicleType.size || 'standard',
        daily_rate: vehicleType.daily_rate || 0,
        is_active: true,
        features: [], 
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } : null,
      created_at: record.created_at || new Date().toISOString(),
      updated_at: record.updated_at || new Date().toISOString(),
    };
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['vehicles', pagination, filters],
    queryFn: async () => {
      try {
        let query = supabase
          .from('vehicles')
          .select('*, vehicle_types(id, name, description, size, daily_rate, is_active)', { count: 'exact' });

        if (filters) {
          if (filters.status) {
            query = query.eq('status', filters.status);
          }
          if (filters.make) {
            query = query.eq('make', filters.make);
          }
          if (filters.model) {
            query = query.ilike('model', `%${filters.model}%`);
          }
          if (filters.vehicle_type_id) {
            query = query.eq('vehicle_type_id', filters.vehicle_type_id);
          }
          if (filters.location) {
            query = query.eq('location', filters.location);
          }
          if (filters.year) {
            query = query.eq('year', filters.year);
          }
        }

        const startIndex = pagination.pageIndex * pagination.pageSize;
        const endIndex = startIndex + pagination.pageSize - 1;

        query = query.range(startIndex, endIndex).order('created_at', { ascending: false });

        const { data: vehicles, error, count } = await query;

        if (error) {
          throw error;
        }

        setTotalCount(count || 0);
        setPageCount(Math.ceil((count || 0) / pagination.pageSize));

        return vehicles ? vehicles.map(mapVehicleFromDatabase) : [];
      } catch (err: any) {
        console.error("Error fetching paginated vehicles:", err);
        throw err;
      }
    },
    placeholderData: (prev) => prev
  });

  useEffect(() => {
    setPageCount(Math.ceil(totalCount / pagination.pageSize));
  }, [totalCount, pagination.pageSize]);

  return {
    vehicles: data || [],
    isLoading,
    error,
    totalCount,
    pageCount,
  };
};

// Export the same function with a different name for backward compatibility
export const useVehiclesList = useVehiclesPagination;
