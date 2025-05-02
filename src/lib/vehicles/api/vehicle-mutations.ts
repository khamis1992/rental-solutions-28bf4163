
import { supabase } from '@/integrations/supabase/client';
import { VehicleInsertData, VehicleUpdateData, DatabaseVehicleRecord } from '@/types/vehicle';
import { mapToDBStatus } from '../vehicle-mappers';
import { castDbId, castToUUID } from '@/utils/supabase-type-helpers';
import { withTimeoutAndRetry } from '@/utils/promise';

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
  
  const { data: result, error } = await supabase
    .from('vehicles')
    .insert(dbData)
    .select()
    .single();
    
  if (error) {
    throw new Error(`Error creating vehicle: ${error.message}`);
  }
  
  return result as DatabaseVehicleRecord;
}

/**
 * Update a vehicle - Refactored to use withTimeoutAndRetry utility
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
  
  const response = await withTimeoutAndRetry(
    async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .update(dbData)
        .eq('id', id)
        .select('*, vehicle_types(*)')
        .single();
      
      if (error) {
        throw error;
      }
      
      return data as DatabaseVehicleRecord;
    },
    {
      retries: 2,
      retryDelayMs: 500,
      timeoutMs: 5000,
      operationName: `Update vehicle ${id}`,
      onProgress: (message) => console.log(message)
    }
  );
  
  if (!response.success) {
    throw response.error || new Error('Failed to update vehicle');
  }
  
  console.log(`API: Vehicle ${id} updated successfully:`, response.data);
  return response.data;
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
