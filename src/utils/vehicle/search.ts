
import { supabase } from '@/lib/supabase';
import { checkSupabaseHealth } from '@/integrations/supabase/client';
import { DatabaseVehicleRecord } from '@/types/vehicle';
import { createDebugLogger } from '@/utils/promise/utils';
import { withTimeoutAndRetry } from '@/utils/promise';

const debug = createDebugLogger('vehicle:search');

/**
 * Find a vehicle by its license plate with improved error handling
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
    
    // Check database connection first
    const connectionStatus = await checkSupabaseHealth();
    if (!connectionStatus.isHealthy) {
      debug(`Database connection issue: ${connectionStatus.error}`);
      return {
        success: false,
        message: `Database connection issue: ${connectionStatus.error || 'Unknown connection error'}`
      };
    }
    
    // Normalize license plate for consistent searching
    const normalizedLicensePlate = licensePlate.trim().toUpperCase();
    debug(`Normalized license plate for search: ${normalizedLicensePlate}`);
    
    // Use withTimeoutAndRetry for the database query
    const result = await withTimeoutAndRetry(
      async () => {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*, vehicle_types(*)')
          .ilike('license_plate', normalizedLicensePlate)
          .maybeSingle();
        
        if (error) {
          throw error;
        }
        
        return data;
      },
      {
        retries: 1,
        retryDelayMs: 500,
        timeoutMs: 5000,
        operationName: `Search vehicle with license plate ${normalizedLicensePlate}`,
      }
    );
    
    if (!result.success) {
      debug(`Database query failed: ${result.error?.message}`);
      return {
        success: false,
        message: `Error searching for vehicle: ${result.error?.message || 'Unknown database error'}`
      };
    }
    
    if (!result.data) {
      debug(`No vehicle found with license plate: ${normalizedLicensePlate}`);
      return {
        success: false,
        message: `No vehicle found with license plate: ${normalizedLicensePlate}`
      };
    }
    
    debug(`Vehicle found: ${result.data.make} ${result.data.model} (${result.data.license_plate})`);
    return {
      success: true,
      data: result.data as DatabaseVehicleRecord,
      message: `Vehicle found: ${result.data.make} ${result.data.model}`
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
