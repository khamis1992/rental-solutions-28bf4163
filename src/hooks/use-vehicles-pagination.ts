
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Vehicle, VehicleFilterParams } from '@/types/vehicle';
import { handleApiError } from '@/hooks/use-api';
import { mapDatabaseRecordToVehicle } from '@/lib/vehicles/vehicle-mappers';
import { PaginationState } from '@/hooks/use-pagination';

// Add the pagination parameter to the options
export interface UseVehiclesListOptions {
  filters?: VehicleFilterParams;
  pagination?: PaginationState;
  enabled?: boolean;
}

export function useVehiclesList({ 
  filters,
  pagination = { page: 1, pageSize: 10, offset: 0 },
  enabled = true
}: UseVehiclesListOptions = {}) {
  // Define the columns we need to select
  const columns = 'id, make, model, year, license_plate, status, image_url, location, mileage';
  
  return useQuery({
    queryKey: ['vehicles', filters, pagination],
    queryFn: async () => {
      console.log(`Fetching vehicles with pagination: page=${pagination.page}, size=${pagination.pageSize}, offset=${pagination.offset}`);
      
      try {
        // First get the total count for pagination
        const countQuery = supabase
          .from('vehicles')
          .select('id', { count: 'exact', head: true });
          
        // Apply filters if provided to the count query
        if (filters) {
          if (filters.status) {
            if (filters.status === 'reserved') {
              countQuery.eq('status', 'reserve');
            } else {
              countQuery.eq('status', filters.status);
            }
          }
          
          if (filters.make) countQuery.eq('make', filters.make);
          if (filters.model) countQuery.ilike('model', `%${filters.model}%`);
          if (filters.vehicle_type_id) countQuery.eq('vehicle_type_id', filters.vehicle_type_id);
          if (filters.location) countQuery.eq('location', filters.location);
          if (filters.year) countQuery.eq('year', filters.year);
          if (filters.search) {
            countQuery.or(`make.ilike.%${filters.search}%,model.ilike.%${filters.search}%,license_plate.ilike.%${filters.search}%`);
          }
        }

        const { count, error: countError } = await countQuery;
        
        if (countError) {
          console.error('Error counting vehicles:', countError);
          throw countError;
        }
        
        // Now fetch the paginated data
        let query = supabase
          .from('vehicles')
          .select(`${columns}, vehicle_types(id, name, description)`)
          .range(pagination.offset, pagination.offset + pagination.pageSize - 1)
          .order('created_at', { ascending: false });
        
        // Apply filters if provided to the data query
        if (filters) {
          if (filters.status) {
            if (filters.status === 'reserved') {
              query = query.eq('status', 'reserve');
            } else {
              query = query.eq('status', filters.status);
            }
          }
          
          if (filters.make) query = query.eq('make', filters.make);
          if (filters.model) query = query.ilike('model', `%${filters.model}%`);
          if (filters.vehicle_type_id) query = query.eq('vehicle_type_id', filters.vehicle_type_id);
          if (filters.location) query = query.eq('location', filters.location);
          if (filters.year) query = query.eq('year', filters.year);
          if (filters.search) {
            query = query.or(`make.ilike.%${filters.search}%,model.ilike.%${filters.search}%,license_plate.ilike.%${filters.search}%`);
          }
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        return {
          data: data.map(record => mapDatabaseRecordToVehicle(record)),
          count: count || 0
        };
      } catch (error) {
        handleApiError(error, 'Failed to fetch vehicles');
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled,
    keepPreviousData: true // Important for smooth pagination transitions
  });
}
