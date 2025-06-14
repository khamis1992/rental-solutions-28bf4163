import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { ExtendedVehicle, VehicleStatus, VehicleUpdate } from '@/types/vehicle';

// Use fallback values if environment variables are not set
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vqdlsidkucrownbfuouq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxZGxzaWRrdWNyb3duYmZ1b3VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMDc4NDgsImV4cCI6MjA0OTg4Mzg0OH0.ARDnjN_J_bz74zQfV7IRDrq6ZL5-xs9L21zI3eG6O5Y';

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

interface UpdateResult {
  success: boolean;
  message: string;
  data?: ExtendedVehicle;
}

/**
 * Updates vehicle information in the database with improved error handling
 */
export async function updateVehicle(
  id: string,
  data: VehicleUpdate
): Promise<UpdateResult> {
  if (!id) {
    console.error('Invalid vehicle ID provided:', id);
    return {
      success: false,
      message: 'Invalid vehicle ID provided'
    };
  }

  // Verify vehicle exists before updating
  const { data: vehicle, error: checkError } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .single();

  if (checkError) {
    console.error(`Error checking if vehicle exists:`, checkError);
    return {
      success: false,
      message: `Error verifying vehicle: ${checkError.message}`
    };
  }

  if (!vehicle) {
    return {
      success: false,
      message: `Vehicle with ID ${id} not found`
    };
  }

  console.log('Current vehicle status in database:', vehicle.status);

  let retryCount = 0;
  const maxRetries = 3;
  let lastError: Error | null = null;

  while (retryCount < maxRetries) {
    try {
      const { data: updatedVehicle, error } = await supabase
        .from('vehicles')
        .update(data)
        .eq('id', id)
        .select('*, vehicle_types(*)')
        .single();

      if (error) {
        console.error(`Attempt ${retryCount + 1}: Error updating vehicle:`, error);
        lastError = error;
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        continue;
      }

      if (!updatedVehicle) {
        console.log('Update may have succeeded but no data returned, fetching vehicle data separately');
        const { data: fetchedVehicle, error: fetchError } = await supabase
          .from('vehicles')
          .select('*, vehicle_types(*)')
          .eq('id', id)
          .single();

        if (fetchError) {
          console.error('Error fetching updated vehicle:', fetchError);
          return {
            success: false,
            message: 'Vehicle updated but failed to fetch updated data',
            data: undefined
          };
        }

        console.log(`Successfully updated vehicle:`, fetchedVehicle);
        return {
          success: true,
          message: `Vehicle updated successfully`,
          data: fetchedVehicle as ExtendedVehicle
        };
      }

      console.log(`Successfully updated vehicle:`, updatedVehicle);
      return {
        success: true,
        message: `Vehicle updated successfully`,
        data: updatedVehicle as ExtendedVehicle
      };
    } catch (updateError) {
      console.error(`Attempt ${retryCount + 1}: Unexpected error updating vehicle:`, updateError);
      lastError = updateError instanceof Error ? updateError : new Error('Unknown error occurred');
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    }
  }

  return {
    success: false,
    message: `Failed to update vehicle after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`
  };
}

/**
 * Find a vehicle by license plate number
 */
export async function findVehicleByLicensePlate(
  licensePlate: string
): Promise<UpdateResult> {
  if (!licensePlate) {
    return {
      success: false,
      message: 'License plate number is required'
    };
  }

  console.log(`Searching for vehicle with license plate: ${licensePlate}`);

  try {
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .select('*, vehicle_types(*)')
      .eq('license_plate', licensePlate)
      .single();

    if (error) {
      console.error('Error searching for vehicle:', error);
      return {
        success: false,
        message: `Error searching for vehicle: ${error.message}`
      };
    }

    if (!vehicle) {
      return {
        success: false,
        message: `No vehicle found with license plate: ${licensePlate}`
      };
    }

    return {
      success: true,
      message: 'Vehicle found',
      data: vehicle as ExtendedVehicle
    };
  } catch (err) {
    console.error('Unexpected error searching for vehicle:', err);
    return {
      success: false,
      message: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`
    };
  }
}

/**
 * Update vehicle status
 */
export async function updateVehicleStatus(
  id: string,
  status: VehicleStatus
): Promise<UpdateResult> {
  if (!id || !status) {
    return {
      success: false,
      message: 'Vehicle ID and status are required'
    };
  }

  console.log(`Updating vehicle ${id} status to:`, status);

  try {
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .update({ status })
      .eq('id', id)
      .select('*, vehicle_types(*)')
      .single();

    if (error) {
      console.error('Error updating vehicle status:', error);
      return {
        success: false,
        message: `Error updating vehicle status: ${error.message}`
      };
    }

    if (!vehicle) {
      return {
        success: false,
        message: 'Vehicle not found or update failed'
      };
    }

    console.log(`Successfully updated vehicle status:`, vehicle);
    return {
      success: true,
      message: 'Vehicle status updated successfully',
      data: vehicle as ExtendedVehicle
    };
  } catch (err) {
    console.error('Unexpected error updating vehicle status:', err);
    return {
      success: false,
      message: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`
    };
  }
}

/**
 * Get all vehicles with their types
 */
export async function getAllVehicles(): Promise<{
  success: boolean;
  message: string;
  data?: ExtendedVehicle[];
}> {
  try {
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select('*, vehicle_types(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching vehicles:', error);
      return {
        success: false,
        message: `Error fetching vehicles: ${error.message}`
      };
    }

    return {
      success: true,
      message: 'Vehicles fetched successfully',
      data: vehicles as ExtendedVehicle[]
    };
  } catch (err) {
    console.error('Unexpected error fetching vehicles:', err);
    return {
      success: false,
      message: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`
    };
  }
}
