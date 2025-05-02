
import { supabase } from '@/integrations/supabase/client';
import { VehicleInsertData, VehicleUpdateData, DatabaseVehicleRecord } from '@/types/vehicle';
import { mapToDBStatus } from '../vehicle-mappers';
import { castDbId, castToUUID } from '@/utils/supabase-type-helpers';

/**
 * Insert a new vehicle 
 */
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

/**
 * Update a vehicle
 */
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

/**
 * Delete a vehicle
 */
export async function deleteVehicle(id: string): Promise<void> {
  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', id);
  
  if (error) {
    throw new Error(`Error deleting vehicle: ${error.message}`);
  }
}
