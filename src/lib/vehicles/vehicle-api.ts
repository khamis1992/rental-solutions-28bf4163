
import { supabase } from '@/integrations/supabase/client';
import { 
  VehicleFilterParams, 
  Vehicle, 
  VehicleFormData, 
  VehicleInsertData, 
  VehicleType, 
  VehicleUpdateData,
  DatabaseVehicleRecord,
  DatabaseVehicleType
} from '@/types/vehicle';
import { mapDatabaseRecordToVehicle, mapToDBStatus, normalizeFeatures } from './vehicle-mappers';

// Fetch vehicles with optional filtering
export async function fetchVehicles(filters?: VehicleFilterParams): Promise<Vehicle[]> {
  let query = supabase.from('vehicles')
    .select('*, vehicle_types(*)');
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'any') {
        // Convert reserved to reserve for database query if status is being filtered
        if (key === 'status' && value === 'reserved') {
          query = query.eq(key, 'reserve');
        } else {
          query = query.eq(key, value);
        }
      }
    });
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(`Error fetching vehicles: ${error.message}`);
  }
  
  // Type assertion to tell TypeScript these are DatabaseVehicleRecord objects
  const vehicleRecords = (data || []) as DatabaseVehicleRecord[];
  return vehicleRecords.map(record => mapDatabaseRecordToVehicle(record));
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
  
  // Map the database vehicle types to application vehicle types with proper size mapping
  return (data || []).map((type: DatabaseVehicleType) => ({
    id: type.id,
    name: type.name,
    size: type.size === 'mid_size' ? 'midsize' : 
          type.size === 'full_size' ? 'fullsize' : 
          type.size as VehicleType['size'],
    daily_rate: type.daily_rate,
    weekly_rate: type.weekly_rate || undefined,
    monthly_rate: type.monthly_rate || undefined,
    description: type.description || undefined,
    features: normalizeFeatures(type.features),
    is_active: type.is_active,
    created_at: type.created_at,
    updated_at: type.updated_at
  }));
}

// Insert a new vehicle 
export async function insertVehicle(vehicleData: VehicleInsertData): Promise<DatabaseVehicleRecord> {
  // Make a copy of the data to avoid modifying the original
  const dbData = { ...vehicleData } as any;
  
  // Handle the reserved to reserve conversion
  if (vehicleData.status) {
    dbData.status = mapToDBStatus(vehicleData.status);
  }
  
  const { data, error } = await supabase
    .from('vehicles')
    .insert(dbData)
    .select()
    .single();
    
  if (error) {
    throw new Error(`Error creating vehicle: ${error.message}`);
  }
  
  return data as DatabaseVehicleRecord;
}

// Update a vehicle
export async function updateVehicle(id: string, vehicleData: VehicleUpdateData): Promise<DatabaseVehicleRecord> {
  // Make a copy of the data to avoid modifying the original
  const dbData = { ...vehicleData } as any;
  
  // Handle the reserved to reserve conversion
  if (vehicleData.status) {
    dbData.status = mapToDBStatus(vehicleData.status);
  }
  
  const { data, error } = await supabase
    .from('vehicles')
    .update(dbData)
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
