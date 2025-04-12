import { supabase } from '@/integrations/supabase/client';
import { 
  VehicleFilterParams, 
  Vehicle, 
  VehicleFormData, 
  VehicleInsertData, 
  VehicleUpdateData, 
  VehicleType, 
  DatabaseVehicleRecord,
  DatabaseVehicleType,
  VehicleStatus,
  DatabaseVehicleStatus
} from '@/types/vehicle';
import { mapDatabaseRecordToVehicle, mapToDBStatus, normalizeFeatures } from './vehicle-mappers';
import { castDbId, castToUUID } from '@/utils/supabase-type-helpers';

// Helper function to convert database status to app status
const mapDBStatusToAppStatus = (dbStatus: string | null): VehicleStatus | null => {
  if (!dbStatus) return null;
  if (dbStatus === 'reserve') return 'reserved';
  return dbStatus as VehicleStatus;
};

// Fetch vehicles with optional filtering
export async function fetchVehicles(filters?: VehicleFilterParams): Promise<Vehicle[]> {
  let query = supabase.from('vehicles')
    .select('*, vehicle_types(*)');
  
  if (filters) {
    // Use a simple for loop with explicit string keys to avoid deep type instantiation
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
  
  // Map the status properly for database storage
  if (dbData.status) {
    dbData.status = mapToDBStatus(dbData.status);
    console.log(`API insertVehicle: Mapped status to DB format: ${dbData.status}`);
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
  
  // Ensure proper status mapping for database storage
  if (dbData.status !== undefined) {
    dbData.status = mapToDBStatus(dbData.status);
    console.log(`API updateVehicle: Mapped status to DB format: ${dbData.status}`);
  }
  
  // Ensure we have an updated_at timestamp
  dbData.updated_at = new Date().toISOString();
  
  console.log(`API: Updating vehicle ${id} with data:`, dbData);
  
  let attempts = 0;
  const maxAttempts = 3;
  let lastError = null;
  
  while (attempts < maxAttempts) {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .update(dbData)
        .eq('id', id)
        .select('*, vehicle_types(*)')
        .single();
      
      if (error) {
        lastError = error;
        console.error(`Update attempt ${attempts + 1} failed:`, error);
        attempts++;
        
        if (attempts < maxAttempts) {
          // Wait before retrying
          await new Promise(r => setTimeout(r, 500 * attempts));
          continue;
        }
        throw error;
      }
      
      console.log(`API: Vehicle ${id} updated successfully:`, data);
      return data as DatabaseVehicleRecord;
    } catch (err) {
      lastError = err;
      console.error(`Update attempt ${attempts + 1} failed with exception:`, err);
      attempts++;
      
      if (attempts < maxAttempts) {
        // Wait before retrying
        await new Promise(r => setTimeout(r, 500 * attempts));
      } else {
        break;
      }
    }
  }
  
  throw lastError || new Error('Failed to update vehicle after multiple attempts');
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
