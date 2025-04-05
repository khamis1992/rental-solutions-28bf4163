
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Vehicle, VehicleFilterParams } from '@/types/vehicle';
import { PaginationState } from '@/hooks/use-pagination';
import { mapDatabaseRecordToVehicle } from '@/lib/vehicles/vehicle-mappers';

interface UseVehiclesPaginationProps {
  pagination: PaginationState;
  filters?: VehicleFilterParams;
}

export const useVehiclesPagination = ({ 
  pagination,
  filters
}: UseVehiclesPaginationProps) => {
  const { pageIndex, pageSize } = pagination;
  const [totalCount, setTotalCount] = useState(0);
  
  // Fetch the count separately for efficiency
  const fetchVehiclesCount = async () => {
    let query = supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true });
    
    if (filters) {
      if (filters.status) {
        if (filters.status === 'reserved') {
          query = query.eq('status', 'reserve');
        } else {
          query = query.eq('status', filters.status);
        }
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
      
      if (filters.search) {
        query = query.or(`make.ilike.%${filters.search}%,model.ilike.%${filters.search}%,license_plate.ilike.%${filters.search}%`);
      }
    }
    
    const { count, error } = await query;
    
    if (error) {
      console.error('Error fetching vehicle count:', error);
      throw error;
    }
    
    return count || 0;
  };
  
  // Fetch the paginated vehicles
  const fetchVehicles = async () => {
    const startIndex = pageIndex * pageSize;
    
    let query = supabase
      .from('vehicles')
      .select('*, vehicle_types(*)')
      .range(startIndex, startIndex + pageSize - 1)
      .order('created_at', { ascending: false });
    
    if (filters) {
      if (filters.status) {
        if (filters.status === 'reserved') {
          query = query.eq('status', 'reserve');
        } else {
          query = query.eq('status', filters.status);
        }
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
      
      if (filters.search) {
        query = query.or(`make.ilike.%${filters.search}%,model.ilike.%${filters.search}%,license_plate.ilike.%${filters.search}%`);
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
    
    // Count query
    const count = await fetchVehiclesCount();
    setTotalCount(count);
    
    return {
      vehicles: (data || []).map(record => mapDatabaseRecordToVehicle(record)),
      count
    };
  };
  
  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: ['vehicles', pageIndex, pageSize, filters],
    queryFn: fetchVehicles,
  });
  
  const pageCount = Math.ceil((totalCount || 0) / pageSize);
  
  return {
    vehicles: data?.vehicles || [],
    isLoading,
    error: error as Error | null,
    totalCount,
    pageCount
  };
};
