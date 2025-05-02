
import { supabase } from '@/lib/supabase';
import { DatabaseVehicleRecord } from '@/types/vehicle';
import { createDebugLogger } from '@/utils/promise/utils';
import { normalizeLicensePlate } from '@/utils/searchUtils';

const debug = createDebugLogger('vehicle:search');

/**
 * Find a vehicle by its license plate with improved normalization and matching
 * 
 * @param licensePlate The license plate to search for
 * @returns Result object with success flag, data and message
 */
export const findVehicleByLicensePlate = async (
  licensePlate: string
): Promise<{
  success: boolean;
  data?: DatabaseVehicleRecord;
  message: string;
}> => {
  try {
    debug(`Searching for vehicle with license plate: ${licensePlate}`);
    
    // Validate input
    if (!licensePlate || typeof licensePlate !== 'string' || licensePlate.trim() === '') {
      debug('Invalid or empty license plate provided');
      return {
        success: false,
        message: 'Please provide a valid license plate'
      };
    }
    
    // Enhanced normalization for consistent searching
    const normalizedLicensePlate = normalizeLicensePlate(licensePlate);
    debug(`Normalized license plate for search: ${normalizedLicensePlate}`);
    
    // Query with normalized license plate
    const { data, error } = await supabase
      .from('vehicles')
      .select('*, vehicle_types(*)')
      .ilike('license_plate', `%${normalizedLicensePlate}%`)
      .maybeSingle();
    
    if (error) {
      debug(`Database query failed: ${error.message}`);
      return {
        success: false,
        message: `Error searching for vehicle: ${error.message}`
      };
    }
    
    if (!data) {
      debug(`No vehicle found with license plate: ${normalizedLicensePlate}`);
      return {
        success: false,
        message: `No vehicle found with license plate: ${licensePlate}`
      };
    }
    
    debug(`Vehicle found: ${data.make} ${data.model} (${data.license_plate})`);
    return {
      success: true,
      data: data as DatabaseVehicleRecord,
      message: `Vehicle found: ${data.make} ${data.model}`
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    debug(`Unexpected error: ${errorMessage}`);
    return {
      success: false,
      message: `Error searching for vehicle: ${errorMessage}`
    };
  }
};
