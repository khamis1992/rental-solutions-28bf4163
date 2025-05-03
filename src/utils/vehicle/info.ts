
import { mapToDBStatus } from '@/lib/vehicles/vehicle-mappers';
import { supabase } from '@/lib/supabase';
import { VehicleStatus } from '@/types/vehicle';
import { normalizeLicensePlate } from '@/utils/searchUtils';
import { createLogger } from '@/utils/error-logger';

// Create a logger for this module
const logger = createLogger('vehicle:info');

/**
 * Updates vehicle information in the database with improved efficiency and normalization
 */
export const updateVehicleInfo = async (
  id: string, 
  data: Partial<{
    status: VehicleStatus;
    make: string;
    model: string;
    year: number;
    license_plate: string;
    vin: string;
    color: string;
    mileage: number;
    location: string;
    description: string;
    insurance_company: string;
    insurance_expiry: string | null;
    rent_amount: number;
    vehicle_type_id: string;
  }>
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    logger.debug(`Updating vehicle ${id}`);
    
    // Validate input parameters
    if (!id || typeof id !== 'string' || id.trim() === '') {
      logger.error('Invalid vehicle ID provided: ' + id);
      return { 
        success: false,
        message: 'Invalid vehicle ID provided' 
      };
    }

    // Prepare update data
    const updateData: any = { ...data };
    
    // Normalize license plate if provided
    if (updateData.license_plate) {
      const originalLicensePlate = updateData.license_plate;
      updateData.license_plate = normalizeLicensePlate(originalLicensePlate);
      logger.debug(`Normalized license plate from "${originalLicensePlate}" to "${updateData.license_plate}"`);
    }
    
    // Map status if provided - ensure proper type handling
    if (updateData.status !== undefined) {
      // Convert any status to proper database format
      try {
        logger.debug(`Pre-mapping status value: ${updateData.status}`);
        const dbStatus = mapToDBStatus(updateData.status);
        updateData.status = dbStatus;
        logger.debug(`Mapped status ${data.status} to database status ${dbStatus}`);
      } catch (err) {
        logger.error('Error mapping status:', err);
        return {
          success: false,
          message: `Invalid status value: ${updateData.status}`
        };
      }
    }
    
    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();
    
    logger.debug('Sending update to database');

    // Perform the update in a single operation
    const { data: updatedVehicle, error } = await supabase
      .from('vehicles')
      .update(updateData)
      .eq('id', id)
      .select('*, vehicle_types(*)')
      .maybeSingle();
      
    if (error) {
      logger.error(`Update failed:`, error);
      return { 
        success: false, 
        message: `Failed to update: ${error.message}`
      };
    }
    
    logger.info(`Successfully updated vehicle ${id}`);
    return { 
      success: true, 
      message: `Vehicle updated successfully`,
      data: updatedVehicle
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Unexpected error updating vehicle:', err);
    return { 
      success: false, 
      message: `Unexpected error: ${errorMessage}` 
    };
  }
};
