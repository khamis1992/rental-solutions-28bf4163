
import { supabase } from '@/integrations/supabase/client';
import { Vehicle, DatabaseVehicleRecord } from '@/types/vehicle';
import { mapDatabaseRecordToVehicle } from '../vehicle-mappers';

/**
 * Fetch a single vehicle by ID
 */
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

/**
 * Get a vehicle with vehicle_types joined
 */
export async function fetchVehicleWithTypes(id: string): Promise<DatabaseVehicleRecord> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*, vehicle_types(*)')
    .eq('id', id)
    .single();
    
  if (error) {
    throw new Error(`Error fetching complete vehicle data: ${error.message}`);
  }
  
  return data as DatabaseVehicleRecord;
}
