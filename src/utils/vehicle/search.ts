
import { checkSupabaseHealth } from '@/integrations/supabase/client';
import { supabase } from '@/lib/supabase';
import { withTimeoutAndRetry } from '@/utils/promise';

/**
 * Find a vehicle by license plate number
 */
export const findVehicleByLicensePlate = async (licensePlate: string): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    if (!licensePlate || licensePlate.trim() === '') {
      return {
        success: false,
        message: 'Please provide a license plate number'
      };
    }

    console.log(`Searching for vehicle with license plate: ${licensePlate}`);
    
    // Check database connection first
    const connectionStatus = await checkSupabaseHealth();
    if (!connectionStatus.isHealthy) {
      return { 
        success: false, 
        message: `Database connection error: ${connectionStatus.error || 'Cannot connect to database'}`
      };
    }
    
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .select('*, vehicle_types(*)')
      .ilike('license_plate', licensePlate.trim())
      .maybeSingle();
      
    if (error) {
      console.error('Error searching for vehicle:', error);
      return {
        success: false,
        message: `Database error: ${error.message}`
      };
    }
    
    if (!vehicle) {
      return {
        success: false,
        message: `No vehicle found with license plate ${licensePlate}`
      };
    }
    
    console.log('Found vehicle:', vehicle);
    return {
      success: true,
      message: 'Vehicle found',
      data: vehicle
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error finding vehicle by license plate:', err);
    return {
      success: false,
      message: `Error: ${errorMessage}`
    };
  }
};
