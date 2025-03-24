
import { supabase } from '@/integrations/supabase/client';
import { VehicleFilterParams, Vehicle, VehicleFormData, VehicleInsertData, VehicleType } from '@/types/vehicle';
import { DatabaseVehicleRecord, mapDatabaseRecordToVehicle } from './vehicle-mappers';

// Fetch vehicles with optional filtering
export async function fetchVehicles(filters?: VehicleFilterParams): Promise<Vehicle[]> {
  let query = supabase.from('vehicles')
    .select('*, vehicle_types(*)');
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'any') {
        query = query.eq(key, value);
      }
    });
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(`Error fetching vehicles: ${error.message}`);
  }
  
  // Type assertion and mapping
  const dbRecords = data as DatabaseVehicleRecord[];
  return dbRecords.map(record => mapDatabaseRecordToVehicle(record));
}

// Fetch a single vehicle by ID
export async function fetchVehicleById(id: string): Promise<Vehicle> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*, vehicle_types(*)')
    .eq('id', id)
    .single();
  
  if (error) {
    throw new Error(`Vehicle with ID ${id} not found: ${error.message}`);
  }
  
  return mapDatabaseRecordToVehicle(data as DatabaseVehicleRecord);
}

// Fetch all vehicle types
export async function fetchVehicleTypes(): Promise<VehicleType[]> {
  const { data, error } = await supabase
    .from('vehicle_types')
    .select('*')
    .eq('is_active', true)
    .order('name');
  
  if (error) {
    throw new Error(`Error fetching vehicle types: ${error.message}`);
  }
  
  return data as VehicleType[];
}
