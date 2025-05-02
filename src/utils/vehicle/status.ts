
import { supabase } from '@/lib/supabase';
import { mapToDBStatus } from '@/lib/vehicles/vehicle-mappers';
import { VehicleStatus } from '@/types/vehicle';
import { withTimeoutAndRetry } from '@/utils/promise';
import { createDebugLogger } from '@/utils/promise/utils';

const debug = createDebugLogger('vehicle:status');

/**
 * Update just the vehicle status with simplified error handling and verification
 * This is the main function used by the StatusUpdateDialog
 */
export const updateVehicleStatus = async (
  id: string,
  status: VehicleStatus
): Promise<{ success: boolean; message: string; data?: any }> => {
  debug(`updateVehicleStatus: Updating vehicle ${id} status to ${status}`);
  
  // Validate the status to ensure it's a valid VehicleStatus value
  const validStatuses: VehicleStatus[] = [
    'available', 'rented', 'reserved', 'maintenance', 
    'police_station', 'accident', 'stolen', 'retired'
  ];
  
  if (!validStatuses.includes(status)) {
    debug(`Invalid status value provided: ${status}`);
    return {
      success: false,
      message: `Invalid status value: ${status}. Must be one of: ${validStatuses.join(', ')}`
    };
  }
  
  try {
    debug(`Converting app status '${status}' to database format`);
    const dbStatus = mapToDBStatus(status);
    
    if (!dbStatus) {
      debug(`Status mapping failed for '${status}'`);
      return {
        success: false,
        message: `Could not map status '${status}' to database format. Valid statuses are: ${validStatuses.join(', ')}`
      };
    }
    
    debug(`Successfully mapped status to database format: '${dbStatus}'`);
    
    // First verify the vehicle exists
    const { data: vehicle, error: checkError } = await supabase
      .from('vehicles')
      .select('id, status')
      .eq('id', id)
      .maybeSingle();
      
    if (checkError) {
      debug(`Error checking vehicle existence: ${checkError.message}`);
      return {
        success: false,
        message: `Failed to verify vehicle: ${checkError.message}`
      };
    }
    
    if (!vehicle) {
      debug(`Vehicle with ID ${id} not found`);
      return {
        success: false,
        message: `Vehicle with ID ${id} not found`
      };
    }
    
    debug(`Current vehicle DB status: ${vehicle.status}, updating to: ${dbStatus}`);
    
    // Using withTimeoutAndRetry for the status update operation
    const updateResult = await withTimeoutAndRetry(
      async () => {
        // Perform a direct update to the database with consistent timestamp
        const timestamp = new Date().toISOString();
        debug(`Performing database update for vehicle ${id} to status "${dbStatus}" with timestamp ${timestamp}`);
        
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
        
        // Verify update was successful
        if (data && data.length > 0) {
          const updatedVehicle = data[0];
          debug(`Update successful. New database status: ${updatedVehicle.status}`);
          
          // Double-check that the status was actually updated
          if (updatedVehicle.status !== dbStatus) {
            debug(`WARNING: Update succeeded but status mismatch: expected ${dbStatus}, got ${updatedVehicle.status}`);
          }
        }
        
        return data;
      },
      {
        retries: 2,
        retryDelayMs: 500,
        timeoutMs: 5000,
        operationName: `Update vehicle ${id} status to ${status}`,
        onRetry: (attempt, error) => {
          debug(`Retry attempt #${attempt} due to error: ${error.message}`);
        }
      }
    );
    
    if (!updateResult.success) {
      debug(`Status update failed: ${updateResult.error?.message}`);
      return {
        success: false,
        message: `Status update failed: ${updateResult.error?.message || 'Unknown error'}`
      };
    }
    
    debug(`Status update successful for vehicle ${id}`);
    return {
      success: true,
      message: `Vehicle status updated to ${status}`,
      data: updateResult.data
    };
  } catch (err) {
    debug(`Error in status update: ${err instanceof Error ? err.message : String(err)}`);
    return {
      success: false,
      message: `Error in status update: ${err instanceof Error ? err.message : 'Unknown error occurred'}`
    };
  }
};
