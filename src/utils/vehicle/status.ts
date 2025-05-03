
import { supabase } from '@/lib/supabase';
import { mapToDBStatus } from '@/lib/vehicles/vehicle-mappers';
import { VehicleStatus } from '@/types/vehicle';
import { createLogger } from '@/utils/error-logger';

const logger = createLogger('vehicle:status');

/**
 * Update vehicle status with improved performance and simplified error handling
 */
export const updateVehicleStatus = async (
  id: string,
  status: VehicleStatus
): Promise<{ success: boolean; message: string; data?: any }> => {
  logger.debug(`Updating vehicle ${id} status to ${status}`);
  
  // Validate the status to ensure it's a valid VehicleStatus value
  const validStatuses: VehicleStatus[] = [
    'available', 'rented', 'reserved', 'maintenance', 
    'police_station', 'accident', 'stolen', 'retired'
  ];
  
  if (!validStatuses.includes(status)) {
    logger.warn(`Invalid status value provided: ${status}`);
    return {
      success: false,
      message: `Invalid status value: ${status}. Must be one of: ${validStatuses.join(', ')}`
    };
  }
  
  try {
    // Convert app status to database format
    logger.debug(`Converting app status '${status}' to database format`);
    const dbStatus = mapToDBStatus(status);
    
    if (!dbStatus) {
      logger.error(`Status mapping failed for '${status}'`);
      return {
        success: false,
        message: `Could not map status '${status}' to database format`
      };
    }
    
    logger.debug(`Mapped status to database format: '${dbStatus}'`);
    
    // Update with timestamp in a single operation for better performance
    const timestamp = new Date().toISOString();
    logger.debug(`Performing database update`);
    
    const { data, error } = await supabase
      .from('vehicles')
      .update({ 
        status: dbStatus,
        updated_at: timestamp
      })
      .eq('id', id)
      .select('*');
      
    if (error) {
      logger.error(`Status update failed: ${error.message}`);
      return {
        success: false,
        message: `Status update failed: ${error.message}`
      };
    }
    
    // Verify update was successful
    if (data && data.length > 0) {
      const updatedVehicle = data[0];
      logger.info(`Update successful for vehicle ${id}`);
      
      return {
        success: true,
        message: `Vehicle status updated to ${status}`,
        data: updatedVehicle
      };
    }
    
    logger.warn(`Update completed but no data returned`);
    return {
      success: true,
      message: `Vehicle status updated to ${status}`
    };
  } catch (err) {
    logger.error(`Error in status update: ${err instanceof Error ? err.message : String(err)}`);
    return {
      success: false,
      message: `Error in status update: ${err instanceof Error ? err.message : 'Unknown error occurred'}`
    };
  }
};
