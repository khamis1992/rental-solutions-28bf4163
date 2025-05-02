
import { supabase } from '@/lib/supabase';
import { mapToDBStatus } from '@/lib/vehicles/vehicle-mappers';
import { VehicleStatus } from '@/types/vehicle';

const debug = (message: string) => {
  console.log(`[vehicle:status] ${message}`);
};

/**
 * Update vehicle status with simplified error handling
 * Streamlined implementation with better reliability
 */
export const updateVehicleStatus = async (
  id: string,
  status: VehicleStatus
): Promise<{ success: boolean; message: string; data?: any }> => {
  debug(`Updating vehicle ${id} status to ${status}`);
  
  // Validate the status to ensure it's a valid VehicleStatus value
  const validStatuses: VehicleStatus[] = [
    'available', 'rented', 'reserved', 'maintenance', 
    'police_station', 'accident', 'stolen', 'retired'
  ];
  
  if (!validStatuses.includes(status as VehicleStatus)) {
    debug(`Invalid status value provided: ${status}`);
    return {
      success: false,
      message: `Invalid status value: ${status}. Must be one of: ${validStatuses.join(', ')}`
    };
  }
  
  try {
    // Convert app status to database format
    debug(`Converting app status '${status}' to database format`);
    const dbStatus = mapToDBStatus(status);
    
    if (!dbStatus) {
      debug(`Status mapping failed for '${status}'`);
      return {
        success: false,
        message: `Could not map status '${status}' to database format`
      };
    }
    
    debug(`Mapped status to database format: '${dbStatus}'`);
    
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
    
    // Perform a direct update with consistent timestamp
    const timestamp = new Date().toISOString();
    debug(`Performing database update with timestamp ${timestamp}`);
    
    const { data, error } = await supabase
      .from('vehicles')
      .update({ 
        status: dbStatus,
        updated_at: timestamp
      })
      .eq('id', id)
      .select('*');
      
    if (error) {
      debug(`Status update failed: ${error.message}`);
      return {
        success: false,
        message: `Status update failed: ${error.message}`
      };
    }
    
    // Verify update was successful
    if (data && data.length > 0) {
      const updatedVehicle = data[0];
      debug(`Update successful. New database status: ${updatedVehicle.status}`);
      
      // Double-check the status was updated correctly
      if (updatedVehicle.status !== dbStatus) {
        debug(`WARNING: Status mismatch: expected ${dbStatus}, got ${updatedVehicle.status}`);
      }
      
      return {
        success: true,
        message: `Vehicle status updated to ${status}`,
        data: updatedVehicle
      };
    }
    
    debug(`Update completed but no data returned`);
    return {
      success: true,
      message: `Vehicle status updated to ${status}`
    };
  } catch (err) {
    debug(`Error in status update: ${err instanceof Error ? err.message : String(err)}`);
    return {
      success: false,
      message: `Error in status update: ${err instanceof Error ? err.message : 'Unknown error occurred'}`
    };
  }
};
