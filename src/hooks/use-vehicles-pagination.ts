
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Vehicle, VehicleFilterParams } from '@/types/vehicle';
import { handleApiError } from '@/hooks/use-api';
import { PaginationState } from '@/hooks/use-pagination';

interface DatabaseVehicleType {
  id: string;
  name: string;
  description?: string;
  is_active?: boolean;
  size?: string;
  daily_rate?: number;
  weekly_rate?: number;
  monthly_rate?: number;
  features?: any[];
}

interface DatabaseVehicleRecord {
  id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  status: string;
  image_url?: string;
  location?: string;
  mileage?: number;
  vin: string;
  created_at: string;
  updated_at: string;
  vehicle_types?: DatabaseVehicleType[];
}

export function mapDatabaseRecordToVehicleForPagination(record: any): Vehicle {
  if (!record.vin) record.vin = '';
  if (!record.created_at) record.created_at = new Date().toISOString();
  if (!record.updated_at) record.updated_at = new Date().toISOString();
  
  return {
    id: record.id,
    make: record.make,
    model: record.model,
    year: record.year,
    license_plate: record.license_plate,
    status: record.status,
    image_url: record.image_url,
    location: record.location,
    mileage: record.mileage,
    vehicleType: record.vehicle_types?.[0] ? {
      id: record.vehicle_types[0].id,
      name: record.vehicle_types[0].name,
      description: record.vehicle_types[0].description || '',
      size: record.vehicle_types[0].size || 'standard',
      daily_rate: record.vehicle_types[0].daily_rate || 0,
      is_active: record.vehicle_types[0].is_active !== false
    } : null,
    vin: record.vin,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

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
  const columns = 'id, make, model, year, license_plate, status, image_url, location, mileage, vin, created_at, updated_at';
  
  return useQuery({
    queryKey: ['vehicles', filters, pagination],
    queryFn: async () => {
      console.log(`Fetching vehicles with pagination: page=${pagination.page}, size=${pagination.pageSize}, offset=${pagination.offset}`);
      
      try {
        const countQuery = supabase
          .from('vehicles')
          .select('id', { count: 'exact', head: true });
          
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
            countQuery.or(
              `make.ilike.%${filters.search}%,model.ilike.%${filters.search}%,license_plate.ilike.%${filters.search}%`
            );
          }
        }

        const { count, error: countError } = await countQuery;
        
        if (countError) {
          console.error('Error counting vehicles:', countError);
          throw countError;
        }
        
        let query = supabase
          .from('vehicles')
          .select(`${columns}, vehicle_types(id, name, description, size, daily_rate, is_active)`)
          .range(pagination.offset, pagination.offset + pagination.pageSize - 1)
          .order('created_at', { ascending: false });
        
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
          data: data.map(record => mapDatabaseRecordToVehicleForPagination(record)),
          count: count || 0
        };
      } catch (error) {
        handleApiError(error, 'Failed to fetch vehicles');
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
    enabled,
  });
}
