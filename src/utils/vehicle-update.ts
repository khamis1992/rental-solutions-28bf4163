
import { toast } from 'sonner';
import { supabase, checkSupabaseHealth } from '@/integrations/supabase/client';
import { mapDatabaseStatus, mapToDBStatus } from '@/lib/vehicles/vehicle-mappers';
import { VehicleStatus } from '@/types/vehicle';

/**
 * Update a vehicle's status using the correct ID
 * @param id The UUID of the vehicle to update
 * @param status The new status of the vehicle
 * @returns A promise with the update result
 */
export const updateVehicleStatus = async (
  id: string, 
  status: VehicleStatus
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    console.log(`Attempting to update vehicle ${id} status to: ${status}`);
    
    // First check database connection
    const connectionStatus = await checkSupabaseHealth();
    if (!connectionStatus.isHealthy) {
      console.error('Database connection error:', connectionStatus.error);
      return { 
        success: false, 
        message: `Database connection error: ${connectionStatus.error || 'Cannot connect to database'}` 
      };
    }
    
    // Map the status to the database format
    const dbStatus = mapToDBStatus(status);
    console.log(`Status mapped for database: ${status} -> ${dbStatus}`);
    
    // Verify vehicle exists before updating
    const { data: vehicle, error: checkError } = await supabase
      .from('vehicles')
      .select('id, status')
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
    
    console.log(`Current vehicle status in database: ${vehicle.status}`);
    
    // Only update if the status is actually changing
    if (dbStatus === vehicle.status) {
      return { 
        success: true, 
        message: `Vehicle already has status: ${status}`,
        data: vehicle
      };
    }
    
    // Update the vehicle status
    const { data: updatedVehicle, error } = await supabase
      .from('vehicles')
      .update({ 
        status: dbStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, vehicle_types(*)')
      .single();
    
    if (error) {
      console.error('Error updating vehicle status:', error);
      return { 
        success: false, 
        message: `Failed to update status: ${error.message}` 
      };
    }
    
    console.log(`Successfully updated vehicle status:`, updatedVehicle);
    return { 
      success: true, 
      message: `Vehicle status updated to ${status}`,
      data: updatedVehicle
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Unexpected error updating vehicle status:', err);
    return { 
      success: false, 
      message: `Unexpected error: ${errorMessage}` 
    };
  }
};

/**
 * Update vehicle information comprehensively
 * @param id The UUID of the vehicle to update
 * @param data The vehicle data to update
 * @returns A promise with the update result
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
    console.log(`Attempting to update vehicle ${id} with data:`, data);
    
    // First check database connection
    const connectionStatus = await checkSupabaseHealth();
    if (!connectionStatus.isHealthy) {
      console.error('Database connection error:', connectionStatus.error);
      return { 
        success: false, 
        message: `Database connection error: ${connectionStatus.error || 'Cannot connect to database'}` 
      };
    }
    
    // Prepare update data
    const updateData: any = { ...data };
    
    // Map status if provided
    if (updateData.status) {
      updateData.status = mapToDBStatus(updateData.status);
      console.log(`Status mapped for update: ${data.status} -> ${updateData.status}`);
    }
    
    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();
    
    // Verify vehicle exists before updating
    const { data: vehicle, error: checkError } = await supabase
      .from('vehicles')
      .select('id')
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
    
    // Update the vehicle
    const { data: updatedVehicle, error } = await supabase
      .from('vehicles')
      .update(updateData)
      .eq('id', id)
      .select('*, vehicle_types(*)')
      .single();
    
    if (error) {
      console.error('Error updating vehicle:', error);
      return { 
        success: false, 
        message: `Failed to update vehicle: ${error.message}` 
      };
    }
    
    console.log(`Successfully updated vehicle:`, updatedVehicle);
    return { 
      success: true, 
      message: `Vehicle updated successfully`,
      data: updatedVehicle
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Unexpected error updating vehicle:', err);
    return { 
      success: false, 
      message: `Unexpected error: ${errorMessage}` 
    };
  }
};

/**
 * Find a vehicle by license plate number
 * @param licensePlate The license plate to search for
 * @returns A promise with the vehicle ID if found
 */
export const findVehicleByLicensePlate = async (
  licensePlate: string
): Promise<{ success: boolean; message: string; id?: string }> => {
  try {
    console.log(`Looking up vehicle with license plate: ${licensePlate}`);
    
    // Clean license plate (remove spaces and convert to uppercase)
    const cleanLicensePlate = licensePlate.trim().toUpperCase();
    
    // First check database connection
    const connectionStatus = await checkSupabaseHealth();
    if (!connectionStatus.isHealthy) {
      console.error('Database connection error:', connectionStatus.error);
      return { 
        success: false, 
        message: `Database connection error: ${connectionStatus.error || 'Cannot connect to database'}` 
      };
    }
    
    // Look up the vehicle
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .select('id')
      .ilike('license_plate', cleanLicensePlate)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`No vehicle found with license plate: ${cleanLicensePlate}`);
        return { 
          success: false, 
          message: `No vehicle found with license plate: ${licensePlate}` 
        };
      }
      
      console.error('Error finding vehicle by license plate:', error);
      return { 
        success: false, 
        message: `Error looking up vehicle: ${error.message}` 
      };
    }
    
    console.log(`Found vehicle with ID: ${vehicle.id}`);
    return { 
      success: true, 
      message: `Found vehicle with license plate: ${licensePlate}`,
      id: vehicle.id
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Unexpected error finding vehicle:', err);
    return { 
      success: false, 
      message: `Unexpected error: ${errorMessage}` 
    };
  }
};
