
import { supabase } from '@/integrations/supabase/client';
import { VehicleFilterParams, Vehicle, DatabaseVehicleRecord } from '@/types/vehicle';
import { mapDatabaseRecordToVehicle, mapToDBStatus } from '../vehicle-mappers';

/**
 * Helper function to convert database status to app status
 */
const mapDBStatusToAppStatus = (dbStatus: string | null): Vehicle['status'] | null => {
  if (!dbStatus) return null;
  if (dbStatus === 'reserve') return 'reserved';
  return dbStatus as Vehicle['status'];
};

/**
 * Fetch vehicles with optional filtering
 */
export async function fetchVehicles(filters?: VehicleFilterParams): Promise<Vehicle[]> {
  let query = supabase.from('vehicles')
    .select('*, vehicle_types(*)');
  
  if (filters) {
    // Support for multiple statuses
    if (filters.statuses && Array.isArray(filters.statuses) && filters.statuses.length > 0) {
      // Map all statuses to DB format
      const dbStatuses = filters.statuses.map(status => mapToDBStatus(status));
      query = query.in('status', dbStatuses);
      console.log(`API fetchVehicles: Filtering by multiple statuses: ${filters.statuses.join(', ')} (mapped to DB statuses: ${dbStatuses.join(', ')})`);
    }
    // Single status filter (backward compatibility)
    else if (filters.status) {
      // Convert application status to database status
      const dbStatus = mapToDBStatus(filters.status);
      query = query.eq('status', dbStatus);
      console.log(`API fetchVehicles: Filtering by status ${filters.status} (mapped to DB status: ${dbStatus})`);
    }
    
    if (filters.make) {
      query = query.eq('make', filters.make);
    }
    
    if (filters.model) {
      query = query.eq('model', filters.model);
    }
    
    if (filters.year) {
      query = query.eq('year', filters.year);
    }
    
    if (filters.location) {
      query = query.eq('location', filters.location);
    }

    if (filters.vehicle_type_id) {
      query = query.eq('vehicle_type_id', filters.vehicle_type_id);
    }
    
    if (filters.search) {
      query = query.or(`vin.ilike.%${filters.search}%,license_plate.ilike.%${filters.search}%`);
    }
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching vehicles:', error);
    throw new Error('Failed to fetch vehicles');
  }
  
  return (data || []).map((record: any) => {
    const vehicle: Vehicle = {
      id: record.id,
      license_plate: record.license_plate,
      make: record.make,
      model: record.model,
      year: record.year,
      color: record.color,
      vin: record.vin,
      mileage: record.mileage,
      status: mapDBStatusToAppStatus(record.status),
      description: record.description,
      image_url: record.image_url,
      created_at: record.created_at,
      updated_at: record.updated_at,
      rent_amount: record.rent_amount,
      insurance_company: record.insurance_company,
      insurance_expiry: record.insurance_expiry,
      location: record.location,
    };
    
    if (record.vehicle_types) {
      vehicle.vehicleType = {
        id: record.vehicle_types.id,
        name: record.vehicle_types.name,
        daily_rate: record.vehicle_types.daily_rate,
      };
      
      // If the vehicle doesn't have a daily rate set directly, use the one from the vehicle type
      if (!vehicle.dailyRate && record.vehicle_types) {
        vehicle.dailyRate = record.vehicle_types.daily_rate;
      }
    }
    
    return vehicle;
  });
}
