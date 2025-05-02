
import { supabase } from '@/lib/supabase';
import { withTimeoutAndRetry } from '@/utils/promise';
import { checkSupabaseHealth } from '@/integrations/supabase/client';
import { DatabaseVehicleRecord } from '@/types/vehicle';

/**
 * Find a vehicle by its license plate with improved reliability
 * 
 * @param licensePlate The license plate to search for
 * @returns Promise with vehicle information or error
 */
export const findVehicleByLicensePlate = async (
  licensePlate: string
): Promise<{ success: boolean; message: string; data?: DatabaseVehicleRecord }> => {
  if (!licensePlate) {
    return {
      success: false,
      message: 'License plate is required'
    };
  }
  
  // Clean up license plate string (remove extra spaces, standardize format)
  const cleanLicensePlate = licensePlate.trim().toUpperCase();
  
  try {
    // Use withTimeoutAndRetry for robust database operations
    const result = await withTimeoutAndRetry(
      async () => {
        // First check database connection health
        const { isHealthy, error: healthError } = await checkSupabaseHealth();
        
        if (!isHealthy) {
          throw new Error(`Database connection error: ${healthError || 'Cannot connect to database'}`);
        }
        
        // Search for the vehicle
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .ilike('license_plate', cleanLicensePlate)
          .maybeSingle();
        
        if (error) {
          throw error;
        }
        
        if (!data) {
          throw new Error(`No vehicle found with license plate ${cleanLicensePlate}`);
        }
        
        return data as DatabaseVehicleRecord;
      },
      {
        timeoutMs: 5000,
        retries: 2,
        retryDelayMs: 1000,
        operationName: `Find vehicle by license plate ${cleanLicensePlate}`
      }
    );
    
    if (!result.success) {
      return {
        success: false,
        message: result.error?.message || `Vehicle with license plate ${cleanLicensePlate} not found`
      };
    }
    
    return {
      success: true,
      message: `Vehicle found`,
      data: result.data
    };
  } catch (error) {
    console.error(`Error finding vehicle by license plate:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error searching for vehicle'
    };
  }
};

/**
 * Batch search vehicles by license plates with concurrent processing
 * 
 * @param licensePlates Array of license plates to search for
 * @param options Configuration options including concurrency
 */
export const batchFindVehiclesByLicensePlate = async (
  licensePlates: string[],
  options: {
    concurrency?: number;
    onProgress?: (status: { completed: number; total: number; current: string }) => void;
  } = {}
): Promise<{
  success: boolean;
  vehicles: DatabaseVehicleRecord[];
  notFound: string[];
  errors: { licensePlate: string; error: string }[];
}> => {
  const { concurrency = 2, onProgress } = options;
  
  try {
    // Import the batchOperations function dynamically to avoid circular dependencies
    const { batchOperations } = await import('@/utils/promise/batch');
    
    const result = await batchOperations(
      licensePlates,
      async (licensePlate) => {
        const result = await findVehicleByLicensePlate(licensePlate);
        if (!result.success || !result.data) {
          throw new Error(result.message);
        }
        return result.data;
      },
      {
        concurrency,
        continueOnError: true,
        onProgress: (status) => {
          if (onProgress) {
            onProgress({
              completed: status.completed,
              total: status.total,
              current: status.current
            });
          }
        }
      }
    );
    
    if (!result.success) {
      return {
        success: false,
        vehicles: result.data?.results || [],
        notFound: [],
        errors: result.data?.errors.map(e => ({
          licensePlate: e.item,
          error: e.error.message
        })) || []
      };
    }
    
    const notFound = result.data.errors
      .filter(e => e.error.message.includes('not found'))
      .map(e => e.item);
    
    const otherErrors = result.data.errors
      .filter(e => !e.error.message.includes('not found'))
      .map(e => ({
        licensePlate: e.item,
        error: e.error.message
      }));
    
    return {
      success: true,
      vehicles: result.data.results,
      notFound,
      errors: otherErrors
    };
  } catch (error) {
    console.error('Error in batch vehicle search:', error);
    return {
      success: false,
      vehicles: [],
      notFound: [],
      errors: [{ 
        licensePlate: 'batch',
        error: error instanceof Error ? error.message : 'Unknown error in batch processing'
      }]
    };
  }
};
