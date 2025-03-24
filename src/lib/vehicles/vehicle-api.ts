
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
  return (data as unknown as DatabaseVehicleRecord[]).map(record => mapDatabaseRecordToVehicle(record));
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
  
  return mapDatabaseRecordToVehicle(data as unknown as DatabaseVehicleRecord);
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
  
  return data.map(type => {
    // Ensure features is an array
    if (typeof type.features === 'string') {
      try {
        type.features = JSON.parse(type.features);
      } catch {
        type.features = [];
      }
    }
    return type as VehicleType;
  });
}

// Insert a new vehicle 
export async function insertVehicle(vehicleData: any): Promise<DatabaseVehicleRecord> {
  const { data, error } = await supabase
    .from('vehicles')
    .insert(vehicleData)
    .select()
    .single();
    
  if (error) {
    throw new Error(`Error creating vehicle: ${error.message}`);
  }
  
  return data as DatabaseVehicleRecord;
}

// Update a vehicle
export async function updateVehicle(id: string, vehicleData: any): Promise<DatabaseVehicleRecord> {
  const { data, error } = await supabase
    .from('vehicles')
    .update(vehicleData)
    .eq('id', id)
    .select('*, vehicle_types(*)')
    .single();
  
  if (error) {
    throw new Error(`Error updating vehicle: ${error.message}`);
  }
  
  return data as DatabaseVehicleRecord;
}

// Delete a vehicle
export async function deleteVehicle(id: string): Promise<void> {
  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', id);
  
  if (error) {
    throw new Error(`Error deleting vehicle: ${error.message}`);
  }
}

// Get a vehicle with vehicle_types joined
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
