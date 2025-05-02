
import { supabase } from '@/lib/supabase';
import { mapToDBStatus } from '@/lib/vehicles/vehicle-mappers';
import { VehicleStatus } from '@/types/vehicle';
import { withTimeoutAndRetry } from '@/utils/promise';

/**
 * Update just the vehicle status with simplified error handling and verification
 * This is the main function used by the StatusUpdateDialog
 */
export const updateVehicleStatus = async (
  id: string,
  status: VehicleStatus
): Promise<{ success: boolean; message: string; data?: any }> => {
  console.log(`updateVehicleStatus: Updating vehicle ${id} status to ${status}`);
  
  // Validate the status to ensure it's a valid VehicleStatus value
  const validStatuses: VehicleStatus[] = [
    'available', 'rented', 'reserved', 'maintenance', 
    'police_station', 'accident', 'stolen', 'retired'
  ];
  
  if (!validStatuses.includes(status)) {
    console.error(`Invalid status value provided: ${status}`);
    return {
      success: false,
      message: `Invalid status value: ${status}. Must be one of: ${validStatuses.join(', ')}`
    };
  }
  
  try {
    console.log(`Status value before mapping: ${status}`);
    const dbStatus = mapToDBStatus(status);
    console.log(`Status value after mapping to DB format: ${dbStatus}`);
    
    // First verify the vehicle exists
    const { data: vehicle, error: checkError } = await supabase
      .from('vehicles')
      .select('id, status')
      .eq('id', id)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking vehicle existence:', checkError);
      return {
        success: false,
        message: `Failed to verify vehicle: ${checkError.message}`
      };
    }
    
    if (!vehicle) {
      console.error(`Vehicle with ID ${id} not found`);
      return {
        success: false,
        message: `Vehicle with ID ${id} not found`
      };
    }
    
    console.log(`Current vehicle DB status: ${vehicle.status}`);
    
    // Using withTimeoutAndRetry for the status update operation
    const updateResult = await withTimeoutAndRetry(
      async () => {
        // Perform a direct update to the database with consistent timestamp
        const timestamp = new Date().toISOString();
        console.log(`Performing database update for vehicle ${id} to status "${dbStatus}" with timestamp ${timestamp}`);
        
        const { data, error } = await supabase
          .from('vehicles')
          .update({ 
            status: dbStatus,
            updated_at: timestamp
          })
          .eq('id', id)
          .select('*');
          
        if (error) {
          throw error;
        }
        
        return data;
      },
      {
        retries: 2,
        retryDelayMs: 500,
        timeoutMs: 5000,
        operationName: `Update vehicle ${id} status to ${status}`
      }
    );
    
    if (!updateResult.success) {
      return {
        success: false,
        message: `Status update failed: ${updateResult.error?.message || 'Unknown error'}`
      };
    }
    
    return {
      success: true,
      message: `Vehicle status updated to ${status}`,
      data: updateResult.data
    };
  } catch (err) {
    console.error('Error in status update:', err);
    return {
      success: false,
      message: `Error in status update: ${err instanceof Error ? err.message : 'Unknown error occurred'}`
    };
  }
};
